import { Router } from 'express';
import { pool, tx } from '../db.js';
import { asyncHandler, HttpError, requireFields } from '../http.js';
import { authenticate, authorize, scopedBranchFilter } from '../middleware/auth.js';
import { cancelExpiredPendingOrders } from './maintenance.js';

const router = Router();
router.use(authenticate);

const orderFlow = {
  pendiente: 'preparando',
  preparando: 'listo',
  listo: 'entregado'
};

router.get('/', asyncHandler(async (req, res) => {
  await cancelExpiredPendingOrders();
  let params = [];
  const clauses = ['1=1'];

  if (req.query.estatus) {
    params.push(req.query.estatus);
    clauses.push(`p.estatus = $${params.length}`);
  }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    clauses.push(`(p.id::text ilike $${params.length} or c.nombre ilike $${params.length})`);
  }
  if (req.query.desde) {
    params.push(req.query.desde);
    clauses.push(`p.fecha_hora::date >= $${params.length}`);
  }
  if (req.query.hasta) {
    params.push(req.query.hasta);
    clauses.push(`p.fecha_hora::date <= $${params.length}`);
  }
  if (req.query.sucursal_id) {
    params.push(req.query.sucursal_id);
    clauses.push(`p.sucursal_id = $${params.length}`);
  }

  const scoped = scopedBranchFilter(req, params, 'p.sucursal_id');
  params = scoped.params;

  const { rows } = await pool.query(
    `select p.*, s.nombre as sucursal_nombre, e.nombre_completo as empleado_nombre,
            coalesce(c.nombre, 'Publico general') as cliente_nombre
     from pedidos p
     join sucursales s on s.id = p.sucursal_id
     join empleados e on e.id = p.empleado_id
     left join clientes c on c.id = p.cliente_id
     where ${clauses.join(' and ')}${scoped.clause}
     order by p.fecha_hora desc
     limit 200`,
    params
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  await cancelExpiredPendingOrders();
  const id = Number(req.params.id);
  const { rows } = await pool.query(
    `select p.*, s.nombre as sucursal_nombre, e.nombre_completo as empleado_nombre,
            coalesce(c.nombre, 'Publico general') as cliente_nombre,
            coalesce(json_agg(json_build_object(
              'id', d.id,
              'producto_id', d.producto_id,
              'producto_nombre', pr.nombre,
              'cantidad', d.cantidad,
              'precio_unitario', d.precio_unitario,
              'porcentaje_descuento', d.porcentaje_descuento,
              'descuento', d.descuento,
              'subtotal', d.subtotal
            )) filter (where d.id is not null), '[]') as detalle
     from pedidos p
     join sucursales s on s.id = p.sucursal_id
     join empleados e on e.id = p.empleado_id
     left join clientes c on c.id = p.cliente_id
     left join detalle_pedido d on d.pedido_id = p.id
     left join productos pr on pr.id = d.producto_id
     where p.id = $1
     group by p.id, s.nombre, e.nombre_completo, c.nombre`,
    [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Pedido no encontrado');
  if (req.user.role !== 'dueno' && rows[0].sucursal_id !== req.user.branch_id) {
    throw new HttpError(403, 'No puedes ver pedidos de otra sucursal');
  }
  res.json(rows[0]);
}));

router.post('/', authorize('dueno', 'gerente', 'cajero'), asyncHandler(async (req, res) => {
  requireFields(req.body, ['sucursal_id', 'empleado_id', 'tipo', 'items']);
  if (!Array.isArray(req.body.items) || !req.body.items.length) {
    throw new HttpError(400, 'El pedido necesita productos');
  }

  const result = await tx(async (client) => {
    const employee = await client.query(
      `select id, puesto, sucursal_id, estatus from empleados where id = $1`,
      [req.body.empleado_id]
    );
    const cashier = employee.rows[0];
    if (!cashier || cashier.estatus !== 'activo') throw new HttpError(400, 'Empleado inactivo o inexistente');
    if (cashier.sucursal_id !== Number(req.body.sucursal_id)) throw new HttpError(400, 'El empleado no pertenece a la sucursal');

    const order = await client.query(
      `insert into pedidos (sucursal_id, empleado_id, cliente_id, tipo, subtotal, descuento_total, total)
       values ($1, $2, $3, $4, 0, 0, 0) returning *`,
      [req.body.sucursal_id, req.body.empleado_id, req.body.cliente_id || null, req.body.tipo]
    );

    let subtotal = 0;
    let discountTotal = 0;
    const detail = [];

    for (const item of req.body.items) {
      const quantity = Number(item.cantidad);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new HttpError(400, 'Cantidad invalida');

      const productResult = await client.query(
        `select id, precio, estatus from productos where id = $1`,
        [item.producto_id]
      );
      const product = productResult.rows[0];
      if (!product || product.estatus !== 'disponible') throw new HttpError(400, 'Producto no disponible');

      let discountPercent = 0;
      if (req.body.promocion_id) {
        const promo = await client.query(
          `select pr.porcentaje_descuento
           from promociones pr
           join promocion_productos pp on pp.promocion_id = pr.id
           where pr.id = $1 and pp.producto_id = $2
             and pr.activo = true
             and current_date between pr.fecha_inicio and pr.fecha_fin`,
          [req.body.promocion_id, product.id]
        );
        discountPercent = Number(promo.rows[0]?.porcentaje_descuento || 0);
      }

      const lineSubtotal = Number(product.precio) * quantity;
      const discount = Number((lineSubtotal * discountPercent / 100).toFixed(2));
      const finalSubtotal = Number((lineSubtotal - discount).toFixed(2));
      subtotal += lineSubtotal;
      discountTotal += discount;

      const saved = await client.query(
        `insert into detalle_pedido
         (pedido_id, producto_id, cantidad, precio_unitario, porcentaje_descuento, descuento, subtotal)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [order.rows[0].id, product.id, quantity, product.precio, discountPercent, discount, finalSubtotal]
      );
      detail.push(saved.rows[0]);
    }

    const total = Number((subtotal - discountTotal).toFixed(2));
    const updated = await client.query(
      `update pedidos set subtotal = $1, descuento_total = $2, total = $3 where id = $4 returning *`,
      [subtotal.toFixed(2), discountTotal.toFixed(2), total.toFixed(2), order.rows[0].id]
    );
    return { ...updated.rows[0], detalle: detail };
  });

  res.status(201).json(result);
}));

router.patch('/:id/estatus', authorize('dueno', 'gerente', 'cajero'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query('select * from pedidos where id = $1', [id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Pedido no encontrado');
  if (order.estatus === 'cancelado') throw new HttpError(400, 'Un pedido cancelado no se puede reactivar');

  const next = orderFlow[order.estatus];
  if (!next || req.body.estatus !== next) {
    throw new HttpError(400, `Flujo invalido. El siguiente estatus permitido es ${next || 'ninguno'}`);
  }

  const updated = await pool.query('update pedidos set estatus = $1 where id = $2 returning *', [next, id]);
  res.json(updated.rows[0]);
}));

router.patch('/:id/cancelar', authorize('dueno', 'gerente', 'cajero'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query(
    `update pedidos
     set estatus = 'cancelado'
     where id = $1 and estatus in ('pendiente', 'preparando')
     returning *`,
    [id]
  );
  if (!rows[0]) throw new HttpError(400, 'Solo se puede cancelar si esta pendiente o preparando');
  res.json(rows[0]);
}));

export default router;

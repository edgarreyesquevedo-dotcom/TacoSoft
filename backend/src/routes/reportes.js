import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../http.js';
import { authenticate, authorize, scopedBranchFilter } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('dueno', 'gerente'));

function filters(req, alias = 'p') {
  let params = [];
  const clauses = [`${alias}.estatus <> 'cancelado'`];

  if (req.query.desde) {
    params.push(req.query.desde);
    clauses.push(`${alias}.fecha_hora::date >= $${params.length}`);
  }
  if (req.query.hasta) {
    params.push(req.query.hasta);
    clauses.push(`${alias}.fecha_hora::date <= $${params.length}`);
  }
  if (req.query.sucursal_id) {
    params.push(req.query.sucursal_id);
    clauses.push(`${alias}.sucursal_id = $${params.length}`);
  }
  const scoped = scopedBranchFilter(req, params, `${alias}.sucursal_id`);
  params = scoped.params;

  return { where: `${clauses.join(' and ')}${scoped.clause}`, params };
}

router.get('/ventas-sucursal', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `select s.nombre as sucursal, count(p.id)::int as total_pedidos,
            coalesce(sum(p.total), 0)::numeric(10,2) as total_pesos,
            coalesce(avg(p.total), 0)::numeric(10,2) as ticket_promedio
     from sucursales s
     left join pedidos p on p.sucursal_id = s.id and ${f.where}
     group by s.id
     order by total_pesos desc`,
    f.params
  );
  res.json(rows);
}));

router.get('/productos-vendidos', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `select pr.nombre as producto, c.nombre as categoria,
            sum(d.cantidad)::int as cantidad, sum(d.subtotal)::numeric(10,2) as total
     from detalle_pedido d
     join pedidos p on p.id = d.pedido_id
     join productos pr on pr.id = d.producto_id
     join categorias c on c.id = pr.categoria_id
     where ${f.where}
     group by pr.id, c.nombre
     order by cantidad desc
     limit 10`,
    f.params
  );
  res.json(rows);
}));

router.get('/ventas-categoria', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `with totals as (
       select c.nombre as categoria, sum(d.subtotal) as total
       from detalle_pedido d
       join pedidos p on p.id = d.pedido_id
       join productos pr on pr.id = d.producto_id
       join categorias c on c.id = pr.categoria_id
       where ${f.where}
       group by c.id
     )
     select categoria, total::numeric(10,2),
            case when sum(total) over () = 0 then 0
                 else round((total / sum(total) over ()) * 100, 2)
            end as porcentaje
     from totals
     order by total desc`,
    f.params
  );
  res.json(rows);
}));

router.get('/empleados', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `select e.nombre_completo as empleado, s.nombre as sucursal,
            count(p.id)::int as pedidos,
            sum(p.total)::numeric(10,2) as total_vendido,
            avg(p.total)::numeric(10,2) as ticket_promedio
     from pedidos p
     join empleados e on e.id = p.empleado_id
     join sucursales s on s.id = p.sucursal_id
     where ${f.where}
     group by e.id, s.nombre
     having count(p.id) > 5
     order by total_vendido desc`,
    f.params
  );
  res.json(rows);
}));

router.get('/comparativo-mensual', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `select to_char(date_trunc('month', p.fecha_hora), 'YYYY-MM') as mes,
            s.nombre as sucursal,
            sum(p.total)::numeric(10,2) as total_ventas
     from pedidos p
     join sucursales s on s.id = p.sucursal_id
     where ${f.where}
     group by mes, s.nombre
     order by mes, s.nombre`,
    f.params
  );
  res.json(rows);
}));

router.get('/productos-sin-movimiento', asyncHandler(async (req, res) => {
  const f = filters(req);
  const { rows } = await pool.query(
    `select pr.nombre as producto, c.nombre as categoria, max(p.fecha_hora) as ultima_venta
     from productos pr
     join categorias c on c.id = pr.categoria_id
     left join detalle_pedido d on d.producto_id = pr.id
     left join pedidos p on p.id = d.pedido_id and ${f.where}
     group by pr.id, c.nombre
     having count(p.id) = 0
     order by pr.nombre`,
    f.params
  );
  res.json(rows);
}));

export default router;

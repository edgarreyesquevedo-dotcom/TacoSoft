import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { pool, tx } from '../db.js';
import { asyncHandler, HttpError, requireFields } from '../http.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const catalogConfig = {
  sucursales: {
    table: 'sucursales',
    searchable: ['nombre', 'ciudad', 'telefono'],
    select: 'select * from sucursales',
    fields: ['nombre', 'direccion', 'ciudad', 'telefono', 'estatus'],
    required: ['nombre', 'direccion', 'ciudad', 'telefono']
  },
  categorias: {
    table: 'categorias',
    searchable: ['nombre', 'descripcion'],
    select: 'select * from categorias',
    fields: ['nombre', 'descripcion', 'activo'],
    required: ['nombre']
  },
  productos: {
    table: 'productos',
    searchable: ['p.nombre', 'p.descripcion', 'c.nombre'],
    select: `select p.*, c.nombre as categoria_nombre
             from productos p join categorias c on c.id = p.categoria_id`,
    fields: ['nombre', 'descripcion', 'categoria_id', 'precio', 'costo', 'estatus'],
    required: ['nombre', 'categoria_id', 'precio', 'costo']
  },
  empleados: {
    table: 'empleados',
    searchable: ['e.nombre_completo', 'e.email', 'e.telefono', 's.nombre'],
    select: `select e.id, e.nombre_completo, e.email, e.telefono, e.puesto, e.sucursal_id,
                    s.nombre as sucursal_nombre, e.salario_quincenal, e.fecha_ingreso, e.estatus
             from empleados e left join sucursales s on s.id = e.sucursal_id`,
    fields: ['nombre_completo', 'email', 'telefono', 'puesto', 'sucursal_id', 'salario_quincenal', 'fecha_ingreso', 'estatus'],
    required: ['nombre_completo', 'email', 'telefono', 'puesto', 'salario_quincenal', 'fecha_ingreso']
  },
  clientes: {
    table: 'clientes',
    searchable: ['nombre', 'telefono', 'correo', 'ciudad'],
    select: 'select * from clientes',
    fields: ['nombre', 'telefono', 'correo', 'ciudad', 'fecha_registro', 'activo'],
    required: ['nombre', 'telefono', 'ciudad']
  },
  promociones: {
    table: 'promociones',
    searchable: ['nombre', 'descripcion'],
    select: `select pr.*,
             coalesce(json_agg(pp.producto_id) filter (where pp.producto_id is not null), '[]') as producto_ids
             from promociones pr left join promocion_productos pp on pp.promocion_id = pr.id`,
    group: ' group by pr.id',
    fields: ['nombre', 'descripcion', 'porcentaje_descuento', 'fecha_inicio', 'fecha_fin', 'activo'],
    required: ['nombre', 'porcentaje_descuento', 'fecha_inicio', 'fecha_fin']
  }
};

function getConfig(name) {
  const config = catalogConfig[name];
  if (!config) throw new HttpError(404, 'Catalogo no encontrado');
  return config;
}

function buildSearch(searchable, q, params) {
  if (!q) return '';
  const clauses = searchable.map((field) => {
    params.push(`%${q}%`);
    return `${field}::text ilike $${params.length}`;
  });
  return ` where (${clauses.join(' or ')})`;
}

async function replacePromotionProducts(client, promotionId, productIds = []) {
  await client.query('delete from promocion_productos where promocion_id = $1', [promotionId]);
  for (const productId of productIds) {
    await client.query(
      'insert into promocion_productos (promocion_id, producto_id) values ($1, $2) on conflict do nothing',
      [promotionId, productId]
    );
  }
}

router.get('/:catalogo', asyncHandler(async (req, res) => {
  const config = getConfig(req.params.catalogo);
  const params = [];
  const where = buildSearch(config.searchable, req.query.q, params);
  const { rows } = await pool.query(`${config.select}${where}${config.group || ''} order by 1 desc limit 200`, params);
  res.json(rows);
}));

router.post('/:catalogo', authorize('dueno', 'gerente'), asyncHandler(async (req, res) => {
  const config = getConfig(req.params.catalogo);
  requireFields(req.body, config.required);

  const result = await tx(async (client) => {
    const body = { ...req.body };
    if (req.params.catalogo === 'empleados') {
      body.password_hash = await bcrypt.hash(body.password || 'TacoSoft2026!', 10);
    }

    const fields = [...config.fields];
    if (req.params.catalogo === 'empleados') fields.push('password_hash');
    const values = fields.filter((field) => body[field] !== undefined);
    const params = values.map((field) => body[field]);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const { rows } = await client.query(
      `insert into ${config.table} (${values.join(', ')}) values (${placeholders}) returning *`,
      params
    );

    if (req.params.catalogo === 'promociones') {
      await replacePromotionProducts(client, rows[0].id, body.producto_ids);
    }

    return rows[0];
  });

  res.status(201).json(result);
}));

router.put('/:catalogo/:id', authorize('dueno', 'gerente'), asyncHandler(async (req, res) => {
  const config = getConfig(req.params.catalogo);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'ID invalido');

  const result = await tx(async (client) => {
    const body = { ...req.body };
    const fields = config.fields.filter((field) => body[field] !== undefined);
    const params = fields.map((field) => body[field]);

    if (req.params.catalogo === 'empleados' && body.password) {
      fields.push('password_hash');
      params.push(await bcrypt.hash(body.password, 10));
    }

    if (!fields.length && req.params.catalogo !== 'promociones') {
      throw new HttpError(400, 'No hay cambios para guardar');
    }

    let row = null;
    if (fields.length) {
      params.push(id);
      const assignments = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const { rows } = await client.query(
        `update ${config.table} set ${assignments} where id = $${params.length} returning *`,
        params
      );
      row = rows[0];
    } else {
      const { rows } = await client.query(`select * from ${config.table} where id = $1`, [id]);
      row = rows[0];
    }

    if (!row) throw new HttpError(404, 'Registro no encontrado');

    if (req.params.catalogo === 'promociones') {
      await replacePromotionProducts(client, id, body.producto_ids);
    }

    return row;
  });

  res.json(result);
}));

router.patch('/:catalogo/:id/baja', authorize('dueno', 'gerente'), asyncHandler(async (req, res) => {
  const config = getConfig(req.params.catalogo);
  const id = Number(req.params.id);
  const statusField = req.params.catalogo === 'sucursales'
    ? "estatus = 'cerrada'"
    : req.params.catalogo === 'productos'
      ? "estatus = 'no_disponible'"
      : req.params.catalogo === 'empleados'
        ? "estatus = 'inactivo'"
        : 'activo = false';

  const { rows } = await pool.query(`update ${config.table} set ${statusField} where id = $1 returning *`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Registro no encontrado');
  res.json(rows[0]);
}));

export default router;

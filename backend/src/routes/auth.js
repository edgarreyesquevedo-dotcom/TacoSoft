import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler, HttpError, requireFields } from '../http.js';
import { authenticate, signSession } from '../middleware/auth.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const { rows } = await pool.query(
    `select id, nombre_completo, email, password_hash, puesto, sucursal_id, estatus
     from empleados
     where lower(email) = lower($1)`,
    [req.body.email]
  );

  const employee = rows[0];
  if (!employee || employee.estatus !== 'activo') {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const ok = await bcrypt.compare(req.body.password, employee.password_hash);
  if (!ok) throw new HttpError(401, 'Credenciales invalidas');

  const token = signSession(employee);
  delete employee.password_hash;
  res.json({ token, user: employee });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select id, nombre_completo, email, puesto, sucursal_id, estatus
     from empleados where id = $1`,
    [req.user.employee_id]
  );
  res.json(rows[0]);
}));

export default router;

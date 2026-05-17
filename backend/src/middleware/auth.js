import jwt from 'jsonwebtoken';
import { HttpError } from '../http.js';

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

export function signSession(employee) {
  return jwt.sign(
    {
      employee_id: employee.id,
      role: employee.puesto,
      branch_id: employee.sucursal_id,
      name: employee.nombre_completo
    },
    secret(),
    { expiresIn: '8h' }
  );
}

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Sesion requerida'));

  try {
    req.user = jwt.verify(token, secret());
    return next();
  } catch (_error) {
    return next(new HttpError(401, 'Sesion invalida o expirada'));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new HttpError(403, 'No tienes permisos para esta accion'));
    }
    return next();
  };
}

export function scopedBranchFilter(req, params, column = 'sucursal_id') {
  if (req.user?.role === 'dueno') return { clause: '', params };
  params.push(req.user.branch_id);
  return { clause: ` and ${column} = $${params.length}`, params };
}

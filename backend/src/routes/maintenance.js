import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler, HttpError } from '../http.js';

const router = Router();

export async function cancelExpiredPendingOrders(client = pool) {
  const { rows } = await client.query(
    `update pedidos
     set estatus = 'cancelado'
     where estatus = 'pendiente'
       and fecha_hora < now() - interval '24 hours'
     returning id`
  );
  return rows.length;
}

router.get('/cancel-expired', asyncHandler(async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const received = req.headers.authorization?.replace('Bearer ', '') || req.query.secret;
  if (expected && received !== expected) throw new HttpError(401, 'No autorizado');

  const canceled = await cancelExpiredPendingOrders();
  res.json({ canceled });
}));

export default router;

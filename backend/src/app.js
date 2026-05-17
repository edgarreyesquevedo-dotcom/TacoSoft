import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalogos.js';
import maintenanceRoutes from './routes/maintenance.js';
import pedidoRoutes from './routes/pedidos.js';
import reporteRoutes from './routes/reportes.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'TacoSoft API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || 'Error interno',
    status
  });
});

export default app;

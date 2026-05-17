# TacoSoft

Sistema web de punto de venta para la cadena de taquerias "El Sinaloense".

Repositorio: https://github.com/edgarreyesquevedo-dotcom/TacoSoft

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL/Supabase
- Deploy: Vercel para frontend y backend serverless

## Estructura

- `frontend/`: aplicacion React.
- `backend/`: API Express compatible con Vercel serverless.
- `database/`: schema, triggers y datos semilla para Supabase/PostgreSQL.

## Arranque Local

1. Instala dependencias:

```bash
npm run install:all
```

2. Crea `backend/.env.local`. No subas este archivo a GitHub:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
JWT_SECRET=cambia-este-secreto
CORS_ORIGIN=http://localhost:5173
CRON_SECRET=secreto-para-vercel-cron
```

3. Crea `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:4000/api
```

4. Ejecuta `database/schema.sql` y luego `database/seed.sql` en Supabase.

5. Inicia:

```bash
npm run dev
```

## Usuarios Demo

Todos los usuarios semilla usan la contrasena `TacoSoft2026!`.

- Dueno: `dueno@tacosoft.local`
- Gerente Culiacan: `gerente.culiacan@tacosoft.local`
- Cajero Culiacan: `cajero.culiacan@tacosoft.local`

## Documentacion De Entrega

- [Guia de despliegue](docs/despliegue.md)
- [Configuracion del proyecto](docs/configuracion-proyecto.md)
- [Manual de usuario](docs/manual-usuario.md)
- [Diagrama entidad-relacion](docs/diagrama-er.md)
- [Checklist de pruebas](docs/checklist-pruebas.md)
- [Resumen para exposicion](docs/resumen-exposicion.md)

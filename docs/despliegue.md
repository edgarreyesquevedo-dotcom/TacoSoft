# Guia De Despliegue

Esta guia deja TacoSoft listo en GitHub, Supabase y Vercel con frontend y backend separados.

## 1. GitHub

Repositorio objetivo:

```text
https://github.com/edgarreyesquevedo-dotcom/TacoSoft
```

Sube el contenido completo de este proyecto al repositorio. No subas archivos `.env`, `.env.local` ni contrasenas.

Ramas recomendadas:

- `main`: version final desplegada.
- `develop`: integracion.
- `feature/*`: trabajo por modulo.

## 2. Supabase

Proyecto Supabase:

```text
https://uxcdpsnhlixbsrxjgwty.supabase.co
```

Pasos:

1. Entra a Supabase.
2. Abre SQL Editor.
3. Ejecuta completo `database/schema.sql`.
4. Ejecuta completo `database/seed.sql`.
5. Verifica que existan las tablas:
   - `sucursales`
   - `categorias`
   - `productos`
   - `empleados`
   - `clientes`
   - `pedidos`
   - `detalle_pedido`
   - `promociones`
   - `promocion_productos`

La cadena de conexion debe usarse como variable de entorno, nunca dentro del codigo:

```env
DATABASE_URL=postgresql://postgres:<DATABASE_PASSWORD>@db.uxcdpsnhlixbsrxjgwty.supabase.co:5432/postgres
```

## 3. Backend En Vercel

Crear un proyecto Vercel separado para el backend.

Configuracion recomendada:

- Root Directory: `backend`
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: dejar vacio

Variables de entorno del backend:

```env
DATABASE_URL=postgresql://postgres:<DATABASE_PASSWORD>@db.uxcdpsnhlixbsrxjgwty.supabase.co:5432/postgres
JWT_SECRET=<un-secreto-largo>
CORS_ORIGIN=<url-del-frontend-en-vercel>
CRON_SECRET=<un-secreto-para-cron>
```

Despues del deploy, prueba:

```text
https://<backend-vercel-url>/api/health
```

Debe responder:

```json
{
  "ok": true,
  "service": "TacoSoft API"
}
```

## 4. Frontend En Vercel

Crear un proyecto Vercel separado para el frontend.

Configuracion recomendada:

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Variable de entorno del frontend:

```env
VITE_API_URL=https://<backend-vercel-url>/api
```

Cuando Vercel genere la URL final del frontend, vuelve al proyecto backend y actualiza:

```env
CORS_ORIGIN=https://<frontend-vercel-url>
```

Luego redeploy del backend.

## 5. Usuarios Demo

Todos usan:

```text
TacoSoft2026!
```

Usuarios:

- `dueno@tacosoft.local`
- `gerente.culiacan@tacosoft.local`
- `cajero.culiacan@tacosoft.local`

## 6. Advertencia De Seguridad

Si una contrasena de Supabase se comparte por chat, capturas o documentos, se recomienda rotarla antes de entregar o publicar el repositorio.

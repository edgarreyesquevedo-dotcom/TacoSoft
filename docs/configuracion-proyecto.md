# Configuracion Del Proyecto TacoSoft

## Datos Confirmados

GitHub:

```text
https://github.com/edgarreyesquevedo-dotcom/TacoSoft
```

Supabase Project URL:

```text
https://uxcdpsnhlixbsrxjgwty.supabase.co
```

Supabase REST API URL:

```text
https://uxcdpsnhlixbsrxjgwty.supabase.co/rest/v1/
```

Deploy:

```text
Frontend y backend separados en Vercel.
```

Contrasena demo de usuarios:

```text
TacoSoft2026!
```

## Variables Para Backend En Vercel

Proyecto Vercel backend, root directory:

```text
backend
```

Variables:

```env
DATABASE_URL=postgresql://postgres:<DATABASE_PASSWORD>@db.uxcdpsnhlixbsrxjgwty.supabase.co:5432/postgres
JWT_SECRET=<crea-un-secreto-largo>
CORS_ORIGIN=https://<frontend-vercel-url>
CRON_SECRET=<crea-un-secreto-largo-para-cron>
```

Ejemplo de `JWT_SECRET`:

```text
tacosoft_2026_sistema_pos_el_sinaloense_jwt_secret
```

Ejemplo de `CRON_SECRET`:

```text
tacosoft_2026_cancelacion_automatica_pedidos
```

## Variables Para Frontend En Vercel

Proyecto Vercel frontend, root directory:

```text
frontend
```

Variable:

```env
VITE_API_URL=https://<backend-vercel-url>/api
```

## Orden Correcto De Implementacion

1. Subir el codigo a GitHub.
2. Ejecutar `database/schema.sql` en Supabase.
3. Ejecutar `database/seed.sql` en Supabase.
4. Crear proyecto backend en Vercel.
5. Agregar variables de entorno del backend.
6. Desplegar backend.
7. Probar `https://<backend-vercel-url>/api/health`.
8. Crear proyecto frontend en Vercel.
9. Agregar `VITE_API_URL` apuntando al backend.
10. Desplegar frontend.
11. Copiar URL final del frontend.
12. Actualizar `CORS_ORIGIN` en backend.
13. Redeploy del backend.
14. Probar login, POS, pedidos, catalogos y reportes.

## Importante

No pegues `DATABASE_PASSWORD` en archivos del repositorio. Solo debe ir en:

- Variables de entorno de Vercel.
- Archivo local `backend/.env.local`, que ya esta ignorado por Git.

# Checklist De Pruebas

## Base De Datos

- [ ] Ejecutar `database/schema.sql` sin errores.
- [ ] Ejecutar `database/seed.sql` sin errores.
- [ ] Confirmar minimo 4 sucursales.
- [ ] Confirmar minimo 5 categorias.
- [ ] Confirmar minimo 20 productos.
- [ ] Confirmar minimo 12 empleados.
- [ ] Confirmar minimo 10 clientes.
- [ ] Confirmar minimo 30 pedidos.
- [ ] Confirmar minimo 3 promociones.

## Autenticacion

- [ ] Login con `dueno@tacosoft.local`.
- [ ] Login con `gerente.culiacan@tacosoft.local`.
- [ ] Login con `cajero.culiacan@tacosoft.local`.
- [ ] Login falla con contrasena incorrecta.
- [ ] El token se guarda y permite navegar.
- [ ] Cerrar sesion limpia la sesion.

## Catalogos

- [ ] Buscar productos.
- [ ] Crear producto.
- [ ] Editar precio de producto.
- [ ] Dar de baja producto.
- [ ] Crear cliente.
- [ ] Crear promocion asociada a productos.
- [ ] Validar que no se pueda tener mas de un gerente activo por sucursal.

## POS

- [ ] Crear pedido como cajero activo.
- [ ] Agregar varios productos.
- [ ] Cambiar cantidades.
- [ ] Crear pedido como publico general.
- [ ] Crear pedido con cliente registrado.
- [ ] Aplicar promocion vigente.
- [ ] Ver que la promocion solo descuente productos incluidos.
- [ ] Intentar vender producto no disponible y confirmar rechazo.
- [ ] Cambiar precio de producto y confirmar que pedidos viejos conservan precio historico.

## Pedidos

- [ ] Filtrar por estatus.
- [ ] Ver detalle completo.
- [ ] Avanzar `pendiente -> preparando`.
- [ ] Avanzar `preparando -> listo`.
- [ ] Avanzar `listo -> entregado`.
- [ ] Confirmar que no se puede regresar estatus.
- [ ] Cancelar pedido pendiente.
- [ ] Confirmar que cancelado no se puede reactivar.
- [ ] Confirmar cancelacion automatica de pendientes mayores a 24 horas.

## Reportes

- [ ] Ventas por sucursal muestra total de pedidos, total y ticket promedio.
- [ ] Productos mas vendidos muestra top 10.
- [ ] Ventas por categoria agrupa correctamente.
- [ ] Rendimiento de empleados muestra solo empleados con mas de 5 pedidos.
- [ ] Comparativo mensual agrupa por mes.
- [ ] Productos sin movimiento lista productos no vendidos en el periodo.

## Deploy

- [ ] Backend responde `/api/health`.
- [ ] Frontend carga sin errores de consola.
- [ ] Login funciona en Vercel.
- [ ] CRUD funciona en Vercel.
- [ ] POS crea pedidos en Supabase.
- [ ] Reportes consultan datos reales.
- [ ] No hay errores CORS.

# Resumen Para Exposicion

## Que Es TacoSoft

TacoSoft es un sistema web de punto de venta para una cadena de taquerias llamada "El Sinaloense", con 4 sucursales en Sinaloa: Culiacan, Mazatlan, Los Mochis y Guasave.

El sistema reemplaza el uso de libretas y Excel por una aplicacion con base de datos relacional, control de pedidos, catalogos, promociones y reportes.

## Tecnologias

- React 18 + TypeScript para frontend.
- Tailwind CSS para estilos.
- Node.js + Express para backend.
- PostgreSQL en Supabase para base de datos.
- Vercel para despliegue separado de frontend y backend.
- GitHub para control de versiones.

## Modulos

1. Autenticacion con JWT y roles.
2. Catalogos CRUD.
3. Punto de venta.
4. Gestion de pedidos.
5. Dashboard de reportes.

## Reglas De Negocio Criticas

- El precio del producto se copia al detalle del pedido al momento de la venta.
- Un empleado inactivo no puede tomar pedidos.
- Solo se pueden vender productos disponibles.
- Las promociones solo aplican dentro de su rango de fechas y a productos asociados.
- El flujo de pedidos es lineal.
- Un pedido cancelado no se puede reactivar.
- Cada sucursal debe tener exactamente un gerente activo.
- No se eliminan registros fisicamente; se usa baja logica.

## Por Que La Base De Datos Es Importante

La base de datos no solo almacena informacion. Tambien protege reglas importantes mediante:

- Llaves primarias y foraneas.
- Tipos `enum`.
- Restricciones `check`.
- Indices.
- Trigger para validar gerente por sucursal.
- Campos numericos precisos para dinero.

## Prueba Recomendada En La Exposicion

1. Iniciar sesion como cajero.
2. Crear un pedido en el POS.
3. Aplicar una promocion.
4. Confirmar el pedido.
5. Abrir gestion de pedidos.
6. Avanzar el estatus.
7. Entrar como dueno o gerente.
8. Revisar reportes.
9. Mostrar en Supabase que el pedido y detalle quedaron guardados.

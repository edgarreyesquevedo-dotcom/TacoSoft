# Manual De Usuario

## Inicio De Sesion

1. Entrar a la URL del frontend en Vercel.
2. Escribir correo y contrasena.
3. Presionar `Entrar`.

Usuarios demo:

- Dueno: `dueno@tacosoft.local`
- Gerente: `gerente.culiacan@tacosoft.local`
- Cajero: `cajero.culiacan@tacosoft.local`

Contrasena:

```text
TacoSoft2026!
```

## Punto De Venta

1. Seleccionar sucursal.
2. Confirmar ID de empleado.
3. Elegir cliente o dejar como publico general.
4. Seleccionar tipo de pedido.
5. Elegir categoria.
6. Agregar productos al carrito.
7. Aplicar promocion si corresponde.
8. Confirmar pedido.

El sistema guarda el precio actual del producto en el detalle del pedido. Si despues cambia el precio del producto, el pedido anterior conserva su precio original.

## Catalogos

Desde el modulo Catalogos se administran:

- Sucursales
- Categorias
- Productos
- Empleados
- Clientes
- Promociones

Cada catalogo permite:

- Buscar registros.
- Crear registros.
- Editar registros.
- Dar de baja sin eliminar fisicamente.

## Gestion De Pedidos

Los pedidos se pueden filtrar por estatus:

- `pendiente`
- `preparando`
- `listo`
- `entregado`
- `cancelado`

Flujo permitido:

```text
pendiente -> preparando -> listo -> entregado
```

Reglas:

- No se puede regresar de estatus.
- Un pedido cancelado no se puede reactivar.
- Solo se puede cancelar si esta `pendiente` o `preparando`.
- Los pedidos pendientes por mas de 24 horas se cancelan automaticamente.

## Reportes

El modulo Reportes permite filtrar por rango de fechas y sucursal.

Reportes incluidos:

- Ventas por sucursal.
- Productos mas vendidos.
- Ventas por categoria.
- Rendimiento de empleados.
- Comparativo mensual.
- Productos sin movimiento.

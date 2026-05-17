# Diagrama Entidad-Relacion

```mermaid
erDiagram
  SUCURSALES ||--o{ EMPLEADOS : asigna
  SUCURSALES ||--o{ PEDIDOS : registra
  CATEGORIAS ||--o{ PRODUCTOS : agrupa
  EMPLEADOS ||--o{ PEDIDOS : atiende
  CLIENTES ||--o{ PEDIDOS : realiza
  PEDIDOS ||--|{ DETALLE_PEDIDO : contiene
  PRODUCTOS ||--o{ DETALLE_PEDIDO : vendido_en
  PROMOCIONES ||--o{ PROMOCION_PRODUCTOS : incluye
  PRODUCTOS ||--o{ PROMOCION_PRODUCTOS : aplica

  SUCURSALES {
    bigint id PK
    text nombre
    text direccion
    text ciudad
    text telefono
    enum estatus
  }

  CATEGORIAS {
    bigint id PK
    text nombre
    text descripcion
    boolean activo
  }

  PRODUCTOS {
    bigint id PK
    bigint categoria_id FK
    text nombre
    numeric precio
    numeric costo
    enum estatus
  }

  EMPLEADOS {
    bigint id PK
    bigint sucursal_id FK
    text nombre_completo
    text email
    text password_hash
    enum puesto
    numeric salario_quincenal
    enum estatus
  }

  CLIENTES {
    bigint id PK
    text nombre
    text telefono
    text correo
    text ciudad
    date fecha_registro
    boolean activo
  }

  PEDIDOS {
    bigint id PK
    bigint sucursal_id FK
    bigint empleado_id FK
    bigint cliente_id FK
    enum tipo
    enum estatus
    numeric subtotal
    numeric descuento_total
    numeric total
  }

  DETALLE_PEDIDO {
    bigint id PK
    bigint pedido_id FK
    bigint producto_id FK
    int cantidad
    numeric precio_unitario
    numeric descuento
    numeric subtotal
  }

  PROMOCIONES {
    bigint id PK
    text nombre
    numeric porcentaje_descuento
    date fecha_inicio
    date fecha_fin
    boolean activo
  }

  PROMOCION_PRODUCTOS {
    bigint promocion_id FK
    bigint producto_id FK
  }
```

## Reglas Implementadas En La Base/API

- El precio historico se guarda en `detalle_pedido.precio_unitario`.
- Los importes usan `NUMERIC(10,2)`.
- Los pedidos no se eliminan fisicamente.
- Los catalogos usan baja logica mediante `estatus` o `activo`.
- Una sucursal no puede tener mas de un gerente activo por indice parcial.
- La API valida que no se pueda dejar una sucursal sin gerente activo.

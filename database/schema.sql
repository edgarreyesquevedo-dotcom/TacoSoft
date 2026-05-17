create extension if not exists pgcrypto;

do $$ begin
  create type branch_status as enum ('activa', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type employee_role as enum ('cajero', 'cocinero', 'repartidor', 'gerente', 'dueno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type employee_status as enum ('activo', 'inactivo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('disponible', 'no_disponible');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('en_local', 'para_llevar', 'a_domicilio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado');
exception when duplicate_object then null; end $$;

create table if not exists sucursales (
  id bigserial primary key,
  nombre text not null unique,
  direccion text not null,
  ciudad text not null,
  telefono text not null,
  estatus branch_status not null default 'activa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categorias (
  id bigserial primary key,
  nombre text not null unique,
  descripcion text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists productos (
  id bigserial primary key,
  nombre text not null,
  descripcion text not null default '',
  categoria_id bigint not null references categorias(id),
  precio numeric(10,2) not null check (precio >= 0),
  costo numeric(10,2) not null check (costo >= 0),
  estatus product_status not null default 'disponible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nombre, categoria_id)
);

create table if not exists empleados (
  id bigserial primary key,
  nombre_completo text not null,
  email text not null unique,
  password_hash text not null,
  telefono text not null,
  puesto employee_role not null,
  sucursal_id bigint references sucursales(id),
  salario_quincenal numeric(10,2) not null check (salario_quincenal >= 0),
  fecha_ingreso date not null,
  estatus employee_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((puesto = 'dueno' and sucursal_id is null) or (puesto <> 'dueno' and sucursal_id is not null))
);

create unique index if not exists one_active_manager_per_branch
  on empleados(sucursal_id)
  where puesto = 'gerente' and estatus = 'activo';

create table if not exists clientes (
  id bigserial primary key,
  nombre text not null,
  telefono text not null,
  correo text unique,
  ciudad text not null,
  fecha_registro date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promociones (
  id bigserial primary key,
  nombre text not null,
  descripcion text not null default '',
  porcentaje_descuento numeric(5,2) not null check (porcentaje_descuento > 0 and porcentaje_descuento <= 100),
  fecha_inicio date not null,
  fecha_fin date not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

create table if not exists promocion_productos (
  promocion_id bigint not null references promociones(id),
  producto_id bigint not null references productos(id),
  primary key (promocion_id, producto_id)
);

create table if not exists pedidos (
  id bigserial primary key,
  sucursal_id bigint not null references sucursales(id),
  empleado_id bigint not null references empleados(id),
  cliente_id bigint references clientes(id),
  fecha_hora timestamptz not null default now(),
  tipo order_type not null,
  estatus order_status not null default 'pendiente',
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  descuento_total numeric(10,2) not null default 0 check (descuento_total >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists detalle_pedido (
  id bigserial primary key,
  pedido_id bigint not null references pedidos(id),
  producto_id bigint not null references productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  porcentaje_descuento numeric(5,2) not null default 0 check (porcentaje_descuento >= 0 and porcentaje_descuento <= 100),
  descuento numeric(10,2) not null default 0 check (descuento >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

create index if not exists idx_productos_categoria on productos(categoria_id);
create index if not exists idx_empleados_sucursal on empleados(sucursal_id);
create index if not exists idx_pedidos_fecha on pedidos(fecha_hora);
create index if not exists idx_pedidos_estatus on pedidos(estatus);
create index if not exists idx_detalle_pedido on detalle_pedido(pedido_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sucursales_updated_at on sucursales;
create trigger trg_sucursales_updated_at before update on sucursales
for each row execute function set_updated_at();

drop trigger if exists trg_categorias_updated_at on categorias;
create trigger trg_categorias_updated_at before update on categorias
for each row execute function set_updated_at();

drop trigger if exists trg_productos_updated_at on productos;
create trigger trg_productos_updated_at before update on productos
for each row execute function set_updated_at();

drop trigger if exists trg_empleados_updated_at on empleados;
create trigger trg_empleados_updated_at before update on empleados
for each row execute function set_updated_at();

drop trigger if exists trg_clientes_updated_at on clientes;
create trigger trg_clientes_updated_at before update on clientes
for each row execute function set_updated_at();

drop trigger if exists trg_promociones_updated_at on promociones;
create trigger trg_promociones_updated_at before update on promociones
for each row execute function set_updated_at();

drop trigger if exists trg_pedidos_updated_at on pedidos;
create trigger trg_pedidos_updated_at before update on pedidos
for each row execute function set_updated_at();

create or replace function ensure_branch_has_manager()
returns trigger language plpgsql as $$
declare
  affected_branch bigint;
  active_managers integer;
begin
  if tg_op in ('UPDATE', 'DELETE') and old.sucursal_id is not null then
    affected_branch := old.sucursal_id;
    select count(*) into active_managers
    from empleados
    where sucursal_id = affected_branch
      and puesto = 'gerente'
      and estatus = 'activo';

    if active_managers <> 1 then
      raise exception 'Cada sucursal debe tener exactamente un gerente activo';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.sucursal_id is not null and (affected_branch is null or affected_branch <> new.sucursal_id) then
    select count(*) into active_managers
    from empleados
    where sucursal_id = new.sucursal_id
      and puesto = 'gerente'
      and estatus = 'activo';

    if active_managers <> 1 then
      raise exception 'Cada sucursal debe tener exactamente un gerente activo';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_empleados_manager_rule on empleados;
create constraint trigger trg_empleados_manager_rule
after insert or update or delete on empleados
deferrable initially deferred
for each row execute function ensure_branch_has_manager();

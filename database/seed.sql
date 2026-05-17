insert into sucursales (nombre, direccion, ciudad, telefono, estatus) values
('El Sinaloense Culiacan', 'Av. Alvaro Obregon 1200', 'Culiacan', '6671001001', 'activa'),
('El Sinaloense Mazatlan', 'Av. del Mar 450', 'Mazatlan', '6691001002', 'activa'),
('El Sinaloense Los Mochis', 'Blvd. Rosales 900', 'Los Mochis', '6681001003', 'activa'),
('El Sinaloense Guasave', 'Calle Zaragoza 310', 'Guasave', '6871001004', 'activa')
on conflict (nombre) do nothing;

insert into categorias (nombre, descripcion) values
('Tacos', 'Tacos clasicos y especiales'),
('Burritos', 'Burritos grandes con guarniciones'),
('Bebidas', 'Aguas frescas y refrescos'),
('Postres', 'Dulces para cerrar la comida'),
('Extras', 'Salsas, ordenes y acompanamientos')
on conflict (nombre) do nothing;

insert into productos (nombre, descripcion, categoria_id, precio, costo, estatus)
select p.nombre, p.descripcion, c.id, p.precio, p.costo, 'disponible'
from (values
('Taco de asada', 'Tortilla de maiz con carne asada', 'Tacos', 28, 13),
('Taco de pastor', 'Pastor con pina y cilantro', 'Tacos', 26, 12),
('Taco de tripa', 'Tripa dorada con cebolla', 'Tacos', 32, 16),
('Taco de birria', 'Birria estilo casa', 'Tacos', 30, 15),
('Burrito norteño', 'Machaca, frijol y queso', 'Burritos', 78, 36),
('Burrito de asada', 'Asada, arroz, frijol y queso', 'Burritos', 82, 39),
('Burrito vegetariano', 'Verduras asadas y frijol', 'Burritos', 70, 31),
('Burrito mar y tierra', 'Camaron y asada', 'Burritos', 110, 56),
('Agua de jamaica', 'Vaso 500 ml', 'Bebidas', 24, 7),
('Agua de horchata', 'Vaso 500 ml', 'Bebidas', 24, 8),
('Refresco lata', '355 ml', 'Bebidas', 22, 10),
('Cebada sinaloense', 'Bebida tradicional', 'Bebidas', 26, 9),
('Flan casero', 'Porcion individual', 'Postres', 38, 16),
('Arroz con leche', 'Porcion individual', 'Postres', 34, 14),
('Churros', 'Orden de cuatro piezas', 'Postres', 42, 19),
('Coyota', 'Postre regional', 'Postres', 30, 13),
('Guacamole', 'Orden chica', 'Extras', 36, 18),
('Frijoles puercos', 'Orden individual', 'Extras', 34, 15),
('Salsa macha', 'Porcion extra', 'Extras', 12, 4),
('Queso extra', 'Porcion extra', 'Extras', 16, 7)
) as p(nombre, descripcion, categoria, precio, costo)
join categorias c on c.nombre = p.categoria
on conflict (nombre, categoria_id) do nothing;

insert into empleados (nombre_completo, email, password_hash, telefono, puesto, sucursal_id, salario_quincenal, fecha_ingreso, estatus)
select e.nombre, e.email, crypt('TacoSoft2026!', gen_salt('bf')), e.telefono, e.puesto::employee_role, s.id, e.salario, e.fecha::date, 'activo'
from (values
('Duenio Demo', 'dueno@tacosoft.local', '6672000000', 'dueno', null, 0, '2024-01-01'),
('Mariana Lopez', 'gerente.culiacan@tacosoft.local', '6672000001', 'gerente', 'Culiacan', 7800, '2024-02-01'),
('Ivan Castro', 'cajero.culiacan@tacosoft.local', '6672000002', 'cajero', 'Culiacan', 4200, '2024-03-10'),
('Sofia Rios', 'cocinero.culiacan@tacosoft.local', '6672000003', 'cocinero', 'Culiacan', 4500, '2024-03-12'),
('Ramon Vega', 'gerente.mazatlan@tacosoft.local', '6692000001', 'gerente', 'Mazatlan', 7800, '2024-02-01'),
('Lucia Bernal', 'cajero.mazatlan@tacosoft.local', '6692000002', 'cajero', 'Mazatlan', 4200, '2024-03-10'),
('Pablo Ibarra', 'repartidor.mazatlan@tacosoft.local', '6692000003', 'repartidor', 'Mazatlan', 3900, '2024-03-12'),
('Claudia Soto', 'gerente.mochis@tacosoft.local', '6682000001', 'gerente', 'Los Mochis', 7800, '2024-02-01'),
('Edgar Luna', 'cajero.mochis@tacosoft.local', '6682000002', 'cajero', 'Los Mochis', 4200, '2024-03-10'),
('Nadia Valdez', 'cocinero.mochis@tacosoft.local', '6682000003', 'cocinero', 'Los Mochis', 4500, '2024-03-12'),
('Hector Meza', 'gerente.guasave@tacosoft.local', '6872000001', 'gerente', 'Guasave', 7800, '2024-02-01'),
('Andrea Felix', 'cajero.guasave@tacosoft.local', '6872000002', 'cajero', 'Guasave', 4200, '2024-03-10'),
('Tomas Reyes', 'repartidor.guasave@tacosoft.local', '6872000003', 'repartidor', 'Guasave', 3900, '2024-03-12')
) as e(nombre, email, telefono, puesto, ciudad, salario, fecha)
left join sucursales s on s.ciudad = e.ciudad
on conflict (email) do nothing;

insert into clientes (nombre, telefono, correo, ciudad, fecha_registro) values
('Alejandro Parra', '6673000001', 'alejandro.parra@example.com', 'Culiacan', '2025-08-01'),
('Brenda Osuna', '6693000002', 'brenda.osuna@example.com', 'Mazatlan', '2025-08-05'),
('Carlos Leyva', '6683000003', 'carlos.leyva@example.com', 'Los Mochis', '2025-09-02'),
('Daniela Quintero', '6873000004', 'daniela.quintero@example.com', 'Guasave', '2025-09-12'),
('Ernesto Lugo', '6673000005', 'ernesto.lugo@example.com', 'Culiacan', '2025-10-01'),
('Fernanda Urias', '6693000006', 'fernanda.urias@example.com', 'Mazatlan', '2025-10-03'),
('Gabriel Beltran', '6683000007', 'gabriel.beltran@example.com', 'Los Mochis', '2025-10-05'),
('Helena Acosta', '6873000008', 'helena.acosta@example.com', 'Guasave', '2025-11-01'),
('Ismael Duarte', '6673000009', 'ismael.duarte@example.com', 'Culiacan', '2025-11-02'),
('Jimena Rojo', '6693000010', 'jimena.rojo@example.com', 'Mazatlan', '2025-11-03')
on conflict (correo) do nothing;

insert into promociones (nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin, activo) values
('Martes de pastor', 'Descuento en tacos de pastor', 15, current_date - interval '10 days', current_date + interval '20 days', true),
('Bebida feliz', 'Descuento en aguas frescas', 10, current_date - interval '5 days', current_date + interval '30 days', true),
('Promo expirada burritos', 'Descuento pasado para burritos', 20, current_date - interval '70 days', current_date - interval '30 days', true)
on conflict do nothing;

insert into promocion_productos (promocion_id, producto_id)
select pr.id, p.id
from promociones pr
join productos p on
  (pr.nombre = 'Martes de pastor' and p.nombre = 'Taco de pastor') or
  (pr.nombre = 'Bebida feliz' and p.nombre in ('Agua de jamaica', 'Agua de horchata')) or
  (pr.nombre = 'Promo expirada burritos' and p.nombre like 'Burrito%')
on conflict do nothing;

insert into pedidos (sucursal_id, empleado_id, cliente_id, fecha_hora, tipo, estatus, subtotal, descuento_total, total)
select s.id, e.id, c.id, now() - (g.n || ' days')::interval, 
       (array['en_local','para_llevar','a_domicilio'])[1 + (g.n % 3)]::order_type,
       (array['pendiente','preparando','listo','entregado'])[1 + (g.n % 4)]::order_status,
       80 + (g.n * 7), 0, 80 + (g.n * 7)
from generate_series(1, 30) as g(n)
join sucursales s on s.id = 1 + ((g.n - 1) % 4)
join empleados e on e.sucursal_id = s.id and e.puesto = 'cajero'
left join clientes c on c.id = 1 + ((g.n - 1) % 10)
where not exists (select 1 from pedidos)
limit 30;

insert into detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, porcentaje_descuento, descuento, subtotal)
select pe.id, p.id, 1 + (pe.id % 3)::int, p.precio, 0, 0, p.precio * (1 + (pe.id % 3)::int)
from pedidos pe
join lateral (
  select id, precio from productos order by ((id + pe.id) % 20) limit 2
) p on true
where not exists (select 1 from detalle_pedido);

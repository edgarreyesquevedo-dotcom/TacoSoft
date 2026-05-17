export type Role = 'cajero' | 'cocinero' | 'repartidor' | 'gerente' | 'dueno';

export interface User {
  id: number;
  nombre_completo: string;
  email: string;
  puesto: Role;
  sucursal_id: number | null;
  estatus: string;
}

export interface Branch {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  estatus: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre?: string;
  precio: string;
  costo: string;
  estatus: 'disponible' | 'no_disponible';
}

export interface Customer {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  ciudad: string;
  fecha_registro: string;
  activo: boolean;
}

export interface Promotion {
  id: number;
  nombre: string;
  descripcion: string;
  porcentaje_descuento: string;
  fecha_inicio: string;
  fecha_fin: string;
  producto_ids: number[];
  activo: boolean;
}

export interface Employee {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  puesto: Role;
  sucursal_id: number | null;
  sucursal_nombre?: string;
  salario_quincenal: string;
  fecha_ingreso: string;
  estatus: string;
}

export interface Order {
  id: number;
  sucursal_id: number;
  empleado_id: number;
  cliente_id: number | null;
  fecha_hora: string;
  tipo: string;
  estatus: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
  subtotal: string;
  descuento_total: string;
  total: string;
  sucursal_nombre?: string;
  empleado_nombre?: string;
  cliente_nombre?: string;
  detalle?: Array<Record<string, unknown>>;
}

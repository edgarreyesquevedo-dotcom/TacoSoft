import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BarChart3,
  Beef,
  Boxes,
  ClipboardList,
  LogOut,
  Minus,
  Plus,
  ReceiptText,
  Search,
} from 'lucide-react';
import { api, getSession, patchJson, postJson, putJson, saveSession } from './services/api';
import type { Branch, Category, Customer, Employee, Order, Product, Promotion, User } from './types';

type Page = 'pos' | 'catalogos' | 'pedidos' | 'reportes';
type CatalogName = 'sucursales' | 'categorias' | 'productos' | 'empleados' | 'clientes' | 'promociones';
type Row = Record<string, any>;

const catalogLabels: Record<CatalogName, string> = {
  sucursales: 'Sucursales',
  categorias: 'Categorias',
  productos: 'Productos',
  empleados: 'Empleados',
  clientes: 'Clientes',
  promociones: 'Promociones'
};

const catalogFields: Record<CatalogName, string[]> = {
  sucursales: ['nombre', 'direccion', 'ciudad', 'telefono', 'estatus'],
  categorias: ['nombre', 'descripcion', 'activo'],
  productos: ['nombre', 'descripcion', 'categoria_id', 'precio', 'costo', 'estatus'],
  empleados: ['nombre_completo', 'email', 'password', 'telefono', 'puesto', 'sucursal_id', 'salario_quincenal', 'fecha_ingreso', 'estatus'],
  clientes: ['nombre', 'telefono', 'correo', 'ciudad', 'fecha_registro', 'activo'],
  promociones: ['nombre', 'descripcion', 'porcentaje_descuento', 'fecha_inicio', 'fecha_fin', 'producto_ids', 'activo']
};

const orderStatus = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

function money(value: string | number | undefined) {
  return Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('dueno@tacosoft.local');
  const [password, setPassword] = useState('TacoSoft2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await postJson<{ token: string; user: User }>('/auth/login', { email, password });
      saveSession(session);
      onLogin(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-masa px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-salsa text-white">
            <Beef size={30} />
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-ink md:text-6xl">
            TacoSoft
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700">
            Punto de venta y reportes para El Sinaloense, con ventas por sucursal, pedidos en tiempo real y reglas de negocio protegidas desde la API.
          </p>
        </section>

        <form onSubmit={submit} className="panel p-6">
          <h2 className="text-2xl font-bold">Iniciar sesion</h2>
          <p className="mt-2 text-sm text-stone-600">Usa los usuarios demo del README o tus empleados registrados.</p>
          <label className="mt-6 block text-sm font-semibold">Correo</label>
          <input className="field mt-2" value={email} onChange={(event) => setEmail(event.target.value)} />
          <label className="mt-4 block text-sm font-semibold">Contrasena</label>
          <input className="field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Shell({ user, onLogout, children, page, setPage }: {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  page: Page;
  setPage: (page: Page) => void;
}) {
  const nav = [
    { id: 'pos' as Page, label: 'POS', icon: ReceiptText },
    { id: 'catalogos' as Page, label: 'Catalogos', icon: Boxes },
    { id: 'pedidos' as Page, label: 'Pedidos', icon: ClipboardList },
    { id: 'reportes' as Page, label: 'Reportes', icon: BarChart3 }
  ].filter((item) => item.id !== 'reportes' || user.puesto !== 'cajero');

  return (
    <div className="min-h-screen bg-masa">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white p-4 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-salsa text-white">
            <Beef />
          </div>
          <div>
            <p className="text-lg font-black">TacoSoft</p>
            <p className="text-xs text-stone-500">El Sinaloense</p>
          </div>
        </div>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                  page === item.id ? 'bg-salsa text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-masa/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 lg:hidden">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setPage(item.id)} className={`btn ${page === item.id ? 'bg-salsa text-white' : 'bg-white'}`}>
                    <Icon size={17} />
                  </button>
                );
              })}
            </div>
            <div>
              <p className="font-bold">{user.nombre_completo}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">{user.puesto}</p>
            </div>
            <button onClick={onLogout} className="btn-secondary">
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function useCatalogs() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  async function refresh() {
    const [s, c, p, cl, pr, e] = await Promise.all([
      api<Branch[]>('/catalogos/sucursales'),
      api<Category[]>('/catalogos/categorias'),
      api<Product[]>('/catalogos/productos'),
      api<Customer[]>('/catalogos/clientes'),
      api<Promotion[]>('/catalogos/promociones'),
      api<Employee[]>('/catalogos/empleados')
    ]);
    setBranches(s);
    setCategories(c);
    setProducts(p);
    setCustomers(cl);
    setPromotions(pr);
    setEmployees(e);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  return { branches, categories, products, customers, promotions, employees, refresh };
}

function CatalogosPage({ catalogs }: { catalogs: ReturnType<typeof useCatalogs> }) {
  const [active, setActive] = useState<CatalogName>('productos');
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [error, setError] = useState('');

  async function load() {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    setRows(await api<Row[]>(`/catalogos/${active}${params}`));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [active]);

  function startCreate() {
    setEditing(null);
    setForm(active === 'clientes' ? { fecha_registro: today(), activo: true } : {});
  }

  function startEdit(row: Row) {
    setEditing(row);
    setForm({ ...row, password: '', producto_ids: Array.isArray(row.producto_ids) ? row.producto_ids.join(',') : row.producto_ids });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = { ...form };
    if (active === 'promociones') {
      payload.producto_ids = String(payload.producto_ids || '')
        .split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean);
    }
    if (editing && !payload.password) delete payload.password;

    try {
      if (editing) await putJson(`/catalogos/${active}/${editing.id}`, payload);
      else await postJson(`/catalogos/${active}`, payload);
      startCreate();
      await Promise.all([load(), catalogs.refresh()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  async function baja(row: Row) {
    await patchJson(`/catalogos/${active}/${row.id}/baja`);
    await Promise.all([load(), catalogs.refresh()]);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Catalogos</h1>
          <p className="text-sm text-stone-600">CRUD con busqueda y baja logica.</p>
        </div>
        <button onClick={startCreate} className="btn-primary"><Plus size={16} /> Nuevo</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(catalogLabels) as CatalogName[]).map((name) => (
          <button key={name} onClick={() => { setActive(name); setEditing(null); setForm({}); }} className={active === name ? 'btn-primary' : 'btn-secondary'}>
            {catalogLabels[name]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="panel overflow-hidden">
          <div className="flex gap-2 border-b border-stone-200 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={17} />
              <input className="field pl-9" placeholder="Buscar..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} />
            </div>
            <button onClick={load} className="btn-secondary">Buscar</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="table-cell">ID</th>
                  <th className="table-cell">Nombre</th>
                  <th className="table-cell">Estado</th>
                  <th className="table-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-stone-100">
                    <td className="table-cell">{row.id}</td>
                    <td className="table-cell font-semibold">{row.nombre || row.nombre_completo}</td>
                    <td className="table-cell">{row.estatus ?? (row.activo ? 'activo' : 'inactivo')}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(row)} className="btn-secondary">Editar</button>
                        <button onClick={() => baja(row)} className="btn-ghost">Baja</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={save} className="panel p-4">
          <h2 className="text-lg font-bold">{editing ? 'Editar' : 'Nuevo'} {catalogLabels[active]}</h2>
          <div className="mt-4 space-y-3">
            {catalogFields[active].map((field) => (
              <label key={field} className="block text-sm font-semibold">
                {field}
                {field === 'categoria_id' ? (
                  <select className="field mt-1" value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })}>
                    <option value="">Selecciona</option>
                    {catalogs.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                ) : field === 'sucursal_id' ? (
                  <select className="field mt-1" value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value || null })}>
                    <option value="">Sin sucursal</option>
                    {catalogs.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.nombre}</option>)}
                  </select>
                ) : field === 'puesto' ? (
                  <select className="field mt-1" value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })}>
                    {['cajero', 'cocinero', 'repartidor', 'gerente', 'dueno'].map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                ) : field === 'estatus' ? (
                  <input className="field mt-1" value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder="activo, disponible, activa..." />
                ) : field === 'activo' ? (
                  <select className="field mt-1" value={String(form[field] ?? true)} onChange={(event) => setForm({ ...form, [field]: event.target.value === 'true' })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input className="field mt-1" type={field.includes('fecha') ? 'date' : field === 'password' ? 'password' : 'text'} value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
                )}
              </label>
            ))}
          </div>
          {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-4 w-full">Guardar</button>
        </form>
      </div>
    </section>
  );
}

function POSPage({ catalogs, user }: { catalogs: ReturnType<typeof useCatalogs>; user: User }) {
  const [branchId, setBranchId] = useState(String(user.sucursal_id || catalogs.branches[0]?.id || ''));
  const [employeeId, setEmployeeId] = useState(String(user.id));
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState('en_local');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [promotionId, setPromotionId] = useState('');
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [message, setMessage] = useState('');

  const visibleProducts = catalogs.products.filter((product) =>
    product.estatus === 'disponible' && (!categoryId || Number(product.categoria_id) === categoryId)
  );
  const promo = catalogs.promotions.find((item) => item.id === Number(promotionId));

  useEffect(() => {
    if (!branchId && catalogs.branches[0]) {
      setBranchId(String(catalogs.branches[0].id));
    }
  }, [branchId, catalogs.branches]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    for (const item of cart) {
      const line = Number(item.product.precio) * item.quantity;
      subtotal += line;
      if (promo?.producto_ids?.includes(item.product.id)) {
        discount += line * Number(promo.porcentaje_descuento) / 100;
      }
    }
    return { subtotal, discount, total: subtotal - discount };
  }, [cart, promo]);

  function add(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { product, quantity: 1 }];
    });
  }

  async function confirm() {
    setMessage('');
    try {
      await postJson('/pedidos', {
        sucursal_id: Number(branchId),
        empleado_id: Number(employeeId),
        cliente_id: customerId ? Number(customerId) : null,
        tipo: type,
        promocion_id: promotionId ? Number(promotionId) : null,
        items: cart.map((item) => ({ producto_id: item.product.id, cantidad: item.quantity }))
      });
      setCart([]);
      setMessage('Pedido confirmado correctamente.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo crear el pedido');
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-black">Punto de venta</h1>
          <p className="text-sm text-stone-600">Toma pedidos con precios historicos, promociones por producto y validacion de cajero activo.</p>
        </div>

        <div className="panel grid gap-3 p-4 md:grid-cols-4">
          <label className="text-sm font-semibold">Sucursal
            <select className="field mt-1" value={branchId} onChange={(event) => setBranchId(event.target.value)}>
              {catalogs.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.ciudad}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Empleado ID
            <input className="field mt-1" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Cliente
            <select className="field mt-1" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Publico general</option>
              {catalogs.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nombre}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Tipo
            <select className="field mt-1" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="en_local">En local</option>
              <option value="para_llevar">Para llevar</option>
              <option value="a_domicilio">A domicilio</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 overflow-auto pb-1">
          <button onClick={() => setCategoryId(null)} className={categoryId === null ? 'btn-primary' : 'btn-secondary'}>Todo</button>
          {catalogs.categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategoryId(cat.id)} className={categoryId === cat.id ? 'btn-primary' : 'btn-secondary'}>{cat.nombre}</button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <button key={product.id} onClick={() => add(product)} className="panel p-4 text-left transition hover:-translate-y-0.5 hover:border-salsa">
              <p className="font-bold">{product.nombre}</p>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600">{product.descripcion}</p>
              <p className="mt-4 text-lg font-black text-nopal">{money(product.precio)}</p>
            </button>
          ))}
        </div>
      </div>

      <aside className="panel h-fit p-4">
        <h2 className="text-xl font-black">Carrito</h2>
        <label className="mt-4 block text-sm font-semibold">Promocion
          <select className="field mt-1" value={promotionId} onChange={(event) => setPromotionId(event.target.value)}>
            <option value="">Sin promocion</option>
            {catalogs.promotions.filter((item) => item.activo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
        </label>
        <div className="mt-4 divide-y divide-stone-100">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{item.product.nombre}</p>
                <p className="text-sm text-stone-500">{money(item.product.precio)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary !p-2" onClick={() => setCart((current) => current.flatMap((row) => row.product.id === item.product.id ? (row.quantity > 1 ? [{ ...row, quantity: row.quantity - 1 }] : []) : [row]))}><Minus size={14} /></button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button className="btn-secondary !p-2" onClick={() => add(item.product)}><Plus size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>
          <div className="flex justify-between"><span>Descuento</span><strong>{money(totals.discount)}</strong></div>
          <div className="flex justify-between text-lg"><span>Total</span><strong>{money(totals.total)}</strong></div>
        </div>
        {message && <p className="mt-4 rounded-md bg-stone-100 px-3 py-2 text-sm">{message}</p>}
        <button onClick={confirm} disabled={!cart.length} className="btn-primary mt-4 w-full">Confirmar pedido</button>
      </aside>
    </section>
  );
}

function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  async function load() {
    setOrders(await api<Order[]>(`/pedidos${status ? `?estatus=${status}` : ''}`));
  }

  useEffect(() => {
    load().catch(console.error);
  }, [status]);

  async function show(id: number) {
    setSelected(await api<Order>(`/pedidos/${id}`));
  }

  async function advance(order: Order) {
    const next = { pendiente: 'preparando', preparando: 'listo', listo: 'entregado' }[order.estatus];
    if (!next) return;
    await patchJson(`/pedidos/${order.id}/estatus`, { estatus: next });
    await load();
  }

  async function cancel(order: Order) {
    await patchJson(`/pedidos/${order.id}/cancelar`);
    await load();
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-black">Pedidos</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setStatus('')} className={!status ? 'btn-primary' : 'btn-secondary'}>Todos</button>
          {orderStatus.map((item) => <button key={item} onClick={() => setStatus(item)} className={status === item ? 'btn-primary' : 'btn-secondary'}>{item}</button>)}
        </div>
        <div className="panel mt-4 overflow-auto">
          <table className="min-w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="table-cell">ID</th>
                <th className="table-cell">Sucursal</th>
                <th className="table-cell">Cliente</th>
                <th className="table-cell">Estatus</th>
                <th className="table-cell">Total</th>
                <th className="table-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-stone-100">
                  <td className="table-cell">#{order.id}</td>
                  <td className="table-cell">{order.sucursal_nombre}</td>
                  <td className="table-cell">{order.cliente_nombre}</td>
                  <td className="table-cell">{order.estatus}</td>
                  <td className="table-cell font-bold">{money(order.total)}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-secondary" onClick={() => show(order.id)}>Detalle</button>
                      {['pendiente', 'preparando', 'listo'].includes(order.estatus) && <button className="btn-secondary" onClick={() => advance(order)}>Avanzar</button>}
                      {['pendiente', 'preparando'].includes(order.estatus) && <button className="btn-ghost" onClick={() => cancel(order)}>Cancelar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="panel h-fit p-4">
        <h2 className="text-xl font-black">Detalle</h2>
        {selected ? (
          <div className="mt-4 space-y-3 text-sm">
            <p><strong>Pedido:</strong> #{selected.id}</p>
            <p><strong>Cliente:</strong> {selected.cliente_nombre}</p>
            <p><strong>Total:</strong> {money(selected.total)}</p>
            <div className="divide-y divide-stone-100">
              {(selected.detalle || []).map((item) => (
                <div key={String(item.id)} className="py-2">
                  <p className="font-semibold">{String(item.producto_nombre)}</p>
                  <p className="text-stone-600">{String(item.cantidad)} x {money(String(item.precio_unitario))}</p>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="mt-4 text-sm text-stone-600">Selecciona un pedido.</p>}
      </aside>
    </section>
  );
}

function ReportesPage({ catalogs }: { catalogs: ReturnType<typeof useCatalogs> }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [branch, setBranch] = useState('');
  const [data, setData] = useState<Record<string, Row[]>>({});

  const reports = [
    ['ventas-sucursal', 'Ventas por sucursal'],
    ['productos-vendidos', 'Productos mas vendidos'],
    ['ventas-categoria', 'Ventas por categoria'],
    ['empleados', 'Rendimiento de empleados'],
    ['comparativo-mensual', 'Comparativo mensual'],
    ['productos-sin-movimiento', 'Productos sin movimiento']
  ];

  async function load() {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (branch) params.set('sucursal_id', branch);
    const entries = await Promise.all(reports.map(async ([key]) => [key, await api<Row[]>(`/reportes/${key}?${params}`)]));
    setData(Object.fromEntries(entries));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Reportes</h1>
        <p className="text-sm text-stone-600">Indicadores por rango de fechas y sucursal.</p>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-4">
        <input type="date" className="field" value={desde} onChange={(event) => setDesde(event.target.value)} />
        <input type="date" className="field" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        <select className="field" value={branch} onChange={(event) => setBranch(event.target.value)}>
          <option value="">Todas las sucursales</option>
          {catalogs.branches.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </select>
        <button className="btn-primary" onClick={load}>Aplicar</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {reports.map(([key, label]) => (
          <div key={key} className="panel overflow-hidden">
            <h2 className="border-b border-stone-200 p-4 text-lg font-black">{label}</h2>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full">
                <tbody>
                  {(data[key] || []).map((row, index) => (
                    <tr key={index} className="border-t border-stone-100">
                      {Object.entries(row).map(([field, value]) => (
                        <td key={field} className="table-cell">
                          <span className="block text-[11px] uppercase text-stone-400">{field}</span>
                          <span className="font-semibold">{String(value ?? '-')}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!data[key]?.length && (
                    <tr><td className="table-cell text-stone-500">Sin datos para mostrar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthenticatedApp({ user, setUser }: { user: User; setUser: (user: User | null) => void }) {
  const [page, setPage] = useState<Page>('pos');
  const catalogs = useCatalogs();

  return (
    <Shell
      user={user}
      page={page}
      setPage={setPage}
      onLogout={() => {
        saveSession(null);
        setUser(null);
      }}
    >
      {page === 'pos' && <POSPage catalogs={catalogs} user={user} />}
      {page === 'catalogos' && <CatalogosPage catalogs={catalogs} />}
      {page === 'pedidos' && <PedidosPage />}
      {page === 'reportes' && <ReportesPage catalogs={catalogs} />}
    </Shell>
  );
}

export default function App() {
  const initial = getSession();
  const [user, setUser] = useState<User | null>(initial?.user || null);

  if (!user) return <Login onLogin={setUser} />;
  return <AuthenticatedApp user={user} setUser={setUser} />;
}

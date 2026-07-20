"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createInventoryAdjustment,
  createProduct,
  fetchAdminOrders,
  fetchInventoryMovements,
  fetchProducts,
  loginAdmin,
  removeProduct,
  updateProduct,
  type AdminOrder,
  type InventoryMovement,
  type ProductItem,
} from '@/lib/admin-api'

type AdminSection = 'overview' | 'products' | 'orders' | 'inventory'

type ProductFormState = {
  id: number | null
  name: string
  description: string
  price: string
  stock: string
}

const emptyForm = (): ProductFormState => ({
  id: null,
  name: '',
  description: '',
  price: '',
  stock: '',
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function isAuthError(err: unknown) {
  return err instanceof Error && ((err as any).status === 401 || (err as any).status === 403)
}

function orderStatusBadgeClass(status: AdminOrder['status']) {
  return `stock-pill ${status.toLowerCase()}`
}

function paymentStatusBadgeClass(status: AdminOrder['paymentStatus']) {
  return `stock-pill ${status.toLowerCase()}`
}

function movementTypeBadgeClass(type: InventoryMovement['type']) {
  return type === 'ORDER_CHECKOUT' ? 'stock-pill checkout' : 'stock-pill admin-adjustment'
}

function movementTypeLabel(type: InventoryMovement['type']) {
  return type === 'ORDER_CHECKOUT' ? 'Checkout' : 'Admin'
}

function movementQuantityBadgeClass(quantityChange: number) {
  return quantityChange < 0 ? 'stock-pill negative' : 'stock-pill positive'
}

function AdminLogin({ loading, email, password, setEmail, setPassword, handleLogin }: {
  loading: boolean
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  return (
    <section className="auth-card admin-auth-card">
      <div className="auth-visual">
        <p className="eyebrow">Solutech Admin</p>
        <h1>Welcome back!</h1>
        <p>Login sekali untuk mengakses overview, products, orders, dan inventory.</p>
      </div>
      <div className="auth-form-card">
        <p className="eyebrow">Restricted area</p>
        <h2>Login admin</h2>
        <p className="muted">Masuk dengan akun admin. User customer akan ditolak dari dashboard ini.</p>
        <form className="form-grid" onSubmit={handleLogin}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          <button disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </section>
  )
}

function AdminShell({ active, email, totalProducts, totalStock, page, totalPages, logout, children }: {
  active: AdminSection
  email: string
  totalProducts: number
  totalStock: number
  page: number
  totalPages: number
  logout: () => void
  children: ReactNode
}) {
  const links = [
    { section: 'overview', href: '/admin', label: 'Dashboard' },
    { section: 'products', href: '/admin/products', label: 'Products' },
    { section: 'orders', href: '/admin/orders', label: 'Orders' },
    { section: 'inventory', href: '/admin/inventory', label: 'Inventory' },
  ] as const

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">SC</span>
          <div>
            <p className="eyebrow">Solutech</p>
            <h2>Admin Panel</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link key={link.href} className={active === link.section ? 'active' : ''} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="sidebar-label">Signed in</span>
          <strong>{email}</strong>
          <p className="muted">JWT protected admin session</p>
        </div>

        <div className="sidebar-stats">
          <div><span className="sidebar-label">Products</span><strong>{totalProducts}</strong></div>
          <div><span className="sidebar-label">Visible stock</span><strong>{totalStock}</strong></div>
          <div><span className="sidebar-label">Page</span><strong>{page}/{totalPages}</strong></div>
        </div>

        <button className="ghost-button" onClick={logout} type="button">Logout</button>
      </aside>
      <section className="dashboard-content">{children}</section>
    </div>
  )
}

export function AdminClient({ section }: { section: AdminSection }) {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('admin-role') === 'ADMIN'
  })
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('admin-email') ?? ''
  })
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [products, setProducts] = useState<ProductItem[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<ProductFormState>(emptyForm())
  const [adjustment, setAdjustment] = useState({ productId: '', quantityChange: '', note: '' })

  const isEditing = useMemo(() => form.id !== null, [form.id])
  const metrics = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
    const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 10).length
    const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)
    return { totalStock, lowStock, inventoryValue }
  }, [products])

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    const timer = window.setTimeout(async () => {
      try {
        setError('')
        if (section === 'overview' || section === 'products') {
          const result = await fetchProducts({ page, limit: 8, search })
          setProducts(result.items)
          setTotalPages(result.meta.totalPages)
          setTotalProducts(result.meta.total)
        }
        if (section === 'overview' || section === 'orders') {
          const result = await fetchAdminOrders({ page: 1, limit: section === 'orders' ? 12 : 5 })
          setOrders(result.items)
        }
        if (section === 'overview' || section === 'inventory') {
          const result = await fetchInventoryMovements({ page: 1, limit: section === 'inventory' ? 12 : 5 })
          setMovements(result.items)
        }
      } catch (err) {
        if (isAuthError(err)) {
          window.localStorage.removeItem('admin-role')
          window.localStorage.removeItem('admin-email')
          setAuthenticated(false)
          setProducts([])
          setOrders([])
          setMovements([])
          router.push('/admin')
        }
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
      }
    }, 200)
    return () => window.clearTimeout(timer)
  }, [authenticated, page, search, section])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await loginAdmin(email, password)
      if (result.user.role !== 'ADMIN') throw new Error('Only admin users can access this dashboard')

      window.localStorage.removeItem('customer-role')
      window.localStorage.removeItem('customer-email')

      setAuthenticated(true)
      setEmail(result.user.email)
      window.localStorage.setItem('admin-role', result.user.role)
      window.localStorage.setItem('admin-email', result.user.email)
      setMessage(`Signed in as ${result.user.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    const result = await fetchProducts({ page, limit: 8, search })
    setProducts(result.items)
    setTotalPages(result.meta.totalPages)
    setTotalProducts(result.meta.total)
  }

  async function loadOrders() {
    const result = await fetchAdminOrders({ page: 1, limit: section === 'orders' ? 12 : 5 })
    setOrders(result.items)
  }

  async function loadMovements() {
    const result = await fetchInventoryMovements({ page: 1, limit: section === 'inventory' ? 12 : 5 })
    setMovements(result.items)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const payload = { name: form.name, description: form.description || null, price: Number(form.price), stock: Number(form.stock) }
      if (form.id === null) {
        await createProduct(payload)
        setMessage('Product created')
      } else {
        await updateProduct(form.id, payload)
        setMessage('Product updated')
      }
      setForm(emptyForm())
      await loadProducts()
    } catch (err) {
      handleAuthFailure(err)
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  function handleAuthFailure(err: unknown) {
    if (!isAuthError(err)) return
    window.localStorage.removeItem('admin-role')
    window.localStorage.removeItem('admin-email')
    setAuthenticated(false)
    setProducts([])
    setOrders([])
    setMovements([])
    router.push('/admin')
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this product?')) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await removeProduct(id)
      setMessage('Product deleted')
      await loadProducts()
    } catch (err) {
      handleAuthFailure(err)
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product: ProductItem) {
    setForm({ id: product.id, name: product.name, description: product.description ?? '', price: String(product.price), stock: String(product.stock) })
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.localStorage.removeItem('admin-role')
    window.localStorage.removeItem('admin-email')
    setAuthenticated(false)
    setProducts([])
    setOrders([])
    setMovements([])
    setMessage('Signed out')
  }

  async function handleAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await createInventoryAdjustment({
        productId: Number(adjustment.productId),
        quantityChange: Number(adjustment.quantityChange),
        note: adjustment.note || undefined,
      })
      setAdjustment({ productId: '', quantityChange: '', note: '' })
      await Promise.all([loadProducts(), loadMovements()])
      setMessage('Inventory adjustment created')
    } catch (err) {
      handleAuthFailure(err)
      setError(err instanceof Error ? err.message : 'Failed to create inventory adjustment')
    } finally {
      setLoading(false)
    }
  }

  let content: ReactNode = null
  if (section === 'overview') {
    content = <Overview metrics={metrics} totalProducts={totalProducts} orders={orders} movements={movements} />
  } else if (section === 'products') {
    content = <ProductsPage products={products} form={form} isEditing={isEditing} loading={loading} page={page} totalPages={totalPages} search={search} setForm={setForm} setPage={setPage} setSearch={setSearch} handleSubmit={handleSubmit} handleDelete={handleDelete} startEdit={startEdit} />
  } else if (section === 'orders') {
    content = <OrdersPage orders={orders} loading={loading} />
  } else {
    content = <InventoryPage movements={movements} adjustment={adjustment} loading={loading} setAdjustment={setAdjustment} handleAdjustment={handleAdjustment} />
  }

  return (
    <main className="admin-page">
      {!mounted || !authenticated ? <AdminLogin loading={loading} email={email} password={password} setEmail={setEmail} setPassword={setPassword} handleLogin={handleLogin} /> : (
        <AdminShell active={section} email={email} totalProducts={totalProducts} totalStock={metrics.totalStock} page={page} totalPages={totalPages} logout={logout}>{content}</AdminShell>
      )}
      {error ? <p className="status error">{error}</p> : null}
      {message ? <p className="status success">{message}</p> : null}
    </main>
  )
}

function Overview({ metrics, totalProducts, orders, movements }: { metrics: { totalStock: number; lowStock: number; inventoryValue: number }; totalProducts: number; orders: AdminOrder[]; movements: InventoryMovement[] }) {
  return (
    <>
      <div className="dashboard-topbar"><div><p className="eyebrow">Dashboard</p><h2>Inventory command center</h2><p className="muted">Ringkasan operasional admin untuk produk, order, dan inventory.</p></div></div>
      <section className="metric-grid">
        <article className="metric-card accent-blue"><span className="sidebar-label">Total products</span><strong>{totalProducts}</strong><p className="muted">All active products.</p></article>
        <article className="metric-card accent-green"><span className="sidebar-label">Visible stock</span><strong>{metrics.totalStock}</strong><p className="muted">Loaded stock units.</p></article>
        <article className="metric-card accent-yellow"><span className="sidebar-label">Low stock</span><strong>{metrics.lowStock}</strong><p className="muted">10 units or less.</p></article>
        <article className="metric-card accent-cyan"><span className="sidebar-label">Inventory value</span><strong>{formatMoney(metrics.inventoryValue)}</strong><p className="muted">Estimated loaded value.</p></article>
      </section>
      <div className="dashboard-grid">
        <section className="panel"><div className="panel-header"><div><p className="eyebrow">Orders</p><h2>Recent orders</h2></div><Link className="ghost-button" href="/admin/orders">Open orders</Link></div><OrderList orders={orders} /></section>
        <section className="panel"><div className="panel-header"><div><p className="eyebrow">Inventory</p><h2>Recent movements</h2></div><Link className="ghost-button" href="/admin/inventory">Open inventory</Link></div><MovementList movements={movements} /></section>
      </div>
    </>
  )
}

function ProductsPage(props: { products: ProductItem[]; form: ProductFormState; isEditing: boolean; loading: boolean; page: number; totalPages: number; search: string; setForm: (value: ProductFormState) => void; setPage: (fn: (value: number) => number) => void; setSearch: (value: string) => void; handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; handleDelete: (id: number) => Promise<void>; startEdit: (product: ProductItem) => void }) {
  const { products, form, isEditing, loading, page, totalPages, search, setForm, setPage, setSearch, handleSubmit, handleDelete, startEdit } = props
  return (
    <>
      <div className="dashboard-topbar"><div><p className="eyebrow">Products</p><h2>Catalog management</h2><p className="muted">Create, edit, search, paginate, and soft delete products.</p></div><input className="search-input" placeholder="Search by name" value={search} onChange={(event) => { setPage(() => 1); setSearch(event.target.value) }} /></div>
      <div className="dashboard-grid">
        <section className="panel"><div className="panel-header"><div><p className="eyebrow">Catalog editor</p><h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2></div><button className="ghost-button" onClick={() => setForm(emptyForm())} type="button">Reset</button></div><ProductForm form={form} setForm={setForm} loading={loading} isEditing={isEditing} handleSubmit={handleSubmit} /></section>
        <section className="panel"><ProductTable products={products} handleDelete={handleDelete} startEdit={startEdit} /><div className="pagination"><button className="ghost-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Prev</button><span>Page {page} of {totalPages}</span><button className="ghost-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div></section>
      </div>
    </>
  )
}

function ProductForm({ form, setForm, loading, isEditing, handleSubmit }: { form: ProductFormState; setForm: (value: ProductFormState) => void; loading: boolean; isEditing: boolean; handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <form className="form-grid" onSubmit={handleSubmit}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></label><div className="two-cols"><label>Price<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" min="0" step="0.01" /></label><label>Stock<input value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} type="number" min="0" step="1" /></label></div><button disabled={loading} type="submit">{loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</button></form>
}

function ProductTable({ products, handleDelete, startEdit }: { products: ProductItem[]; handleDelete: (id: number) => Promise<void>; startEdit: (product: ProductItem) => void }) {
  return <><div className="panel-header"><div><p className="eyebrow">Inventory table</p><h2>Products</h2></div><span className="muted">{products.length} shown</span></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><p className="muted">{product.description ?? '-'}</p></td><td>{formatMoney(product.price)}</td><td><span className={product.stock <= 10 ? 'stock-pill warning' : 'stock-pill'}>{product.stock}</span></td><td><div className="action-row"><button className="ghost-button" onClick={() => startEdit(product)} type="button">Edit</button><button className="danger-button" onClick={() => handleDelete(product.id)} type="button">Delete</button></div></td></tr>)}{products.length === 0 ? <tr><td colSpan={4} className="empty-state">No products found.</td></tr> : null}</tbody></table></div></>
}

function OrdersPage({ orders, loading }: { orders: AdminOrder[]; loading: boolean }) {
  return <><div className="dashboard-topbar"><div><p className="eyebrow">Orders</p><h2>Order management</h2><p className="muted">View all orders and their status.</p></div><span className="stock-pill">{orders.length} shown</span></div><section className="panel"><OrderList orders={orders} /></section></>
}

function OrderList({ orders, loading, handleOrderStatus, handleOrderPayment }: { orders: AdminOrder[]; loading?: boolean; handleOrderStatus?: (id: number, status: AdminOrder['status']) => Promise<void>; handleOrderPayment?: (id: number, paymentStatus: AdminOrder['paymentStatus']) => Promise<void> }) {
  return <div className="order-list">{orders.map((order) => <article key={order.id} className="order-card"><div><strong>Order #{order.id}</strong><div className="badge-row"><span className={orderStatusBadgeClass(order.status)}>{order.status}</span><span className={paymentStatusBadgeClass(order.paymentStatus)}>Payment {order.paymentStatus}</span></div><p className="muted">User #{order.userId} · {order.paymentMethod} · {formatMoney(order.total)}</p><p className="muted">Ship to {order.shippingName}, {order.shippingCity}</p></div>{handleOrderStatus && handleOrderPayment ? <div className="two-cols"><label>Status<span className={orderStatusBadgeClass(order.status)}>{order.status}</span><select disabled={loading} value={order.status} onChange={(event) => handleOrderStatus(order.id, event.target.value as AdminOrder['status'])}><option value="PENDING">PENDING</option><option value="PAID">PAID</option><option value="PROCESSING">PROCESSING</option><option value="SHIPPED">SHIPPED</option><option value="COMPLETED">COMPLETED</option></select></label><label>Payment<span className={paymentStatusBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span><select disabled={loading} value={order.paymentStatus} onChange={(event) => handleOrderPayment(order.id, event.target.value as AdminOrder['paymentStatus'])}><option value="PENDING">PENDING</option><option value="PAID">PAID</option></select></label></div> : null}</article>)}{orders.length === 0 ? <p className="empty-state">No orders found.</p> : null}</div>
}

function InventoryPage({ movements, adjustment, loading, setAdjustment, handleAdjustment }: { movements: InventoryMovement[]; adjustment: { productId: string; quantityChange: string; note: string }; loading: boolean; setAdjustment: (value: { productId: string; quantityChange: string; note: string }) => void; handleAdjustment: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <><div className="dashboard-topbar"><div><p className="eyebrow">Inventory</p><h2>Stock adjustments</h2><p className="muted">Create adjustment and audit inventory movement history.</p></div><span className="stock-pill">{movements.length} movements</span></div><div className="dashboard-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">Adjustment</p><h2>Adjust stock</h2></div></div><form className="form-grid" onSubmit={handleAdjustment}><div className="two-cols"><label>Product ID<input value={adjustment.productId} onChange={(event) => setAdjustment({ ...adjustment, productId: event.target.value })} type="number" min="1" /></label><label>Quantity change<input value={adjustment.quantityChange} onChange={(event) => setAdjustment({ ...adjustment, quantityChange: event.target.value })} type="number" step="1" /></label></div><label>Note<input value={adjustment.note} onChange={(event) => setAdjustment({ ...adjustment, note: event.target.value })} /></label><button disabled={loading} type="submit">Create adjustment</button></form></section><section className="panel"><div className="panel-header"><div><p className="eyebrow">Inventory audit</p><h2>Movements</h2></div></div><MovementList movements={movements} /></section></div></>
}

function MovementList({ movements }: { movements: InventoryMovement[] }) {
  return <div className="order-list">{movements.map((movement) => <article key={movement.id} className="order-card"><div><strong>{movement.productName}</strong><div className="badge-row"><span className={movementTypeBadgeClass(movement.type)}>{movementTypeLabel(movement.type)}</span><span className={movementQuantityBadgeClass(movement.quantityChange)}>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</span></div><p className="muted">Stock {movement.stockBefore} → {movement.stockAfter}</p><p className="muted">{movement.note ?? '-'}</p></div></article>)}{movements.length === 0 ? <p className="empty-state">No movements found.</p> : null}</div>
}

"use client"

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  createInventoryAdjustment,
  fetchAdminOrders,
  fetchInventoryMovements,
  fetchProducts,
  loginAdmin,
  removeProduct,
  updateAdminOrderPayment,
  updateAdminOrderStatus,
  updateProduct,
  type AdminOrder,
  type InventoryMovement,
  type ProductItem,
} from '@/lib/admin-api'

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

export default function AdminPage() {
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem('admin-token') ?? ''))
  const [email, setEmail] = useState('admin@solutech.test')
  const [password, setPassword] = useState('password123')
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
    if (!token) return

    const timer = window.setTimeout(async () => {
      try {
        setError('')
        const [result, orderResult, movementResult] = await Promise.all([
          fetchProducts(token, { page, limit: 8, search }),
          fetchAdminOrders(token, { page: 1, limit: 5 }),
          fetchInventoryMovements(token, { page: 1, limit: 5 }),
        ])
        setProducts(result.items)
        setTotalPages(result.meta.totalPages)
        setTotalProducts(result.meta.total)
        setOrders(orderResult.items)
        setMovements(movementResult.items)
      } catch (err) {
        if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
          window.localStorage.removeItem('admin-token')
          setToken('')
          setProducts([])
        }
        setError(err instanceof Error ? err.message : 'Failed to load products')
      }
    }, 200)

    return () => window.clearTimeout(timer)
  }, [token, page, search])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await loginAdmin(email, password)
      if (result.user.role !== 'ADMIN') {
        throw new Error('Only admin users can access this dashboard')
      }

      setToken(result.token)
      window.localStorage.setItem('admin-token', result.token)
      setMessage(`Signed in as ${result.user.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts(currentToken = token) {
    const result = await fetchProducts(currentToken, { page, limit: 8, search })
    setProducts(result.items)
    setTotalPages(result.meta.totalPages)
    setTotalProducts(result.meta.total)
  }

  async function loadAdminPanels(currentToken = token) {
    const [orderResult, movementResult] = await Promise.all([
      fetchAdminOrders(currentToken, { page: 1, limit: 5 }),
      fetchInventoryMovements(currentToken, { page: 1, limit: 5 }),
    ])
    setOrders(orderResult.items)
    setMovements(movementResult.items)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        stock: Number(form.stock),
      }

      if (form.id === null) {
        await createProduct(token, payload)
        setMessage('Product created')
      } else {
        await updateProduct(token, form.id, payload)
        setMessage('Product updated')
      }

      setForm(emptyForm())
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    const confirmed = window.confirm('Delete this product?')
    if (!confirmed) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await removeProduct(token, id)
      setMessage('Product deleted')
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product: ProductItem) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
    })
  }

  function logout() {
    window.localStorage.removeItem('admin-token')
    setToken('')
    setProducts([])
    setOrders([])
    setMovements([])
    setMessage('Signed out')
  }

  async function handleOrderStatus(id: number, status: AdminOrder['status']) {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      await updateAdminOrderStatus(token, id, status)
      await loadAdminPanels()
      setMessage('Order status updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setLoading(false)
    }
  }

  async function handleOrderPayment(id: number, paymentStatus: AdminOrder['paymentStatus']) {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      await updateAdminOrderPayment(token, id, paymentStatus)
      await loadAdminPanels()
      setMessage('Order payment updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment status')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await createInventoryAdjustment(token, {
        productId: Number(adjustment.productId),
        quantityChange: Number(adjustment.quantityChange),
        note: adjustment.note || undefined,
      })
      setAdjustment({ productId: '', quantityChange: '', note: '' })
      await Promise.all([loadProducts(), loadAdminPanels()])
      setMessage('Inventory adjustment created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory adjustment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Inventory command center</h1>
          <p className="lede">Kelola katalog, stok, dan visibility produk dari panel admin yang dilindungi role.</p>
        </div>
        {token ? (
          <button className="ghost-button" onClick={logout} type="button">Logout</button>
        ) : null}
      </section>

      {!token ? (
        <section className="auth-card">
          <p className="eyebrow">Restricted area</p>
          <h2>Login admin</h2>
          <p className="muted">Masuk dengan akun admin. User customer akan ditolak dari dashboard ini.</p>
          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>
            <button disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </section>
      ) : (
        <div className="dashboard-shell">
          <aside className="sidebar">
            <div className="sidebar-brand">
              <p className="eyebrow">Solutech</p>
              <h2>Admin Panel</h2>
              <p className="muted">Product operations</p>
            </div>

            <nav className="sidebar-nav">
              <a href="#overview">Overview</a>
              <a href="#insights">Insights</a>
              <a href="#products">Products</a>
              <a href="#editor">Editor</a>
            </nav>

            <div className="sidebar-card">
              <span className="sidebar-label">Signed in</span>
              <strong>{email}</strong>
              <p className="muted">JWT protected admin session</p>
            </div>

            <div className="sidebar-stats">
              <div>
                <span className="sidebar-label">Products</span>
                <strong>{totalProducts}</strong>
              </div>
              <div>
                <span className="sidebar-label">Visible stock</span>
                <strong>{metrics.totalStock}</strong>
              </div>
              <div>
                <span className="sidebar-label">Page</span>
                <strong>{page}/{totalPages}</strong>
              </div>
            </div>

            <button className="ghost-button" onClick={logout} type="button">Logout</button>
          </aside>

          <section className="dashboard-content">
            <div className="dashboard-topbar" id="overview">
              <div>
                <p className="eyebrow">Overview</p>
                <h2>Manage product operations</h2>
                <p className="muted">Create, edit, search, paginate, and soft delete products from one place.</p>
              </div>
              <input className="search-input" placeholder="Search by name" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
            </div>

            <section className="metric-grid" id="insights">
              <article className="metric-card">
                <span className="sidebar-label">Total products</span>
                <strong>{totalProducts}</strong>
                <p className="muted">All active products matching current catalog query.</p>
              </article>
              <article className="metric-card">
                <span className="sidebar-label">Visible stock</span>
                <strong>{metrics.totalStock}</strong>
                <p className="muted">Total units loaded on this dashboard page.</p>
              </article>
              <article className="metric-card">
                <span className="sidebar-label">Low stock</span>
                <strong>{metrics.lowStock}</strong>
                <p className="muted">Products with 10 units or less on current page.</p>
              </article>
              <article className="metric-card">
                <span className="sidebar-label">Inventory value</span>
                <strong>{formatMoney(metrics.inventoryValue)}</strong>
                <p className="muted">Estimated value from loaded products.</p>
              </article>
            </section>

            <div className="dashboard-grid">
              <section className="panel" id="editor">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Catalog editor</p>
                    <h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2>
                  </div>
                  <button className="ghost-button" onClick={() => setForm(emptyForm())} type="button">Reset</button>
                </div>
                <form className="form-grid" onSubmit={handleSubmit}>
                  <label>
                    Name
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label>
                    Description
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                  </label>
                  <div className="two-cols">
                    <label>
                      Price
                      <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" min="0" step="0.01" />
                    </label>
                    <label>
                      Stock
                      <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} type="number" min="0" step="1" />
                    </label>
                  </div>
                  <button disabled={loading} type="submit">{loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</button>
                </form>
              </section>

              <section className="panel" id="products">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Inventory table</p>
                    <h2>Products</h2>
                  </div>
                  <span className="muted">{products.length} shown</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.name}</strong>
                            <p className="muted">{product.description ?? '-'}</p>
                          </td>
                          <td>{formatMoney(product.price)}</td>
                          <td><span className={product.stock <= 10 ? 'stock-pill warning' : 'stock-pill'}>{product.stock}</span></td>
                          <td>
                            <div className="action-row">
                              <button className="ghost-button" onClick={() => startEdit(product)} type="button">Edit</button>
                              <button className="danger-button" onClick={() => handleDelete(product.id)} type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-state">No products found.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button className="ghost-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Prev</button>
                  <span>Page {page} of {totalPages}</span>
                  <button className="ghost-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
                </div>
              </section>

              <section className="panel" id="orders">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Orders</p>
                    <h2>Recent orders</h2>
                  </div>
                </div>
                <div className="order-list">
                  {orders.map((order) => (
                    <article key={order.id} className="order-card">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <p className="muted">User #{order.userId} · {order.paymentMethod} · {formatMoney(order.total)}</p>
                        <p className="muted">Ship to {order.shippingName}, {order.shippingCity}</p>
                      </div>
                      <div className="two-cols">
                        <label>
                          Status
                          <select value={order.status} onChange={(event) => handleOrderStatus(order.id, event.target.value as AdminOrder['status'])}>
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </label>
                        <label>
                          Payment
                          <select value={order.paymentStatus} onChange={(event) => handleOrderPayment(order.id, event.target.value as AdminOrder['paymentStatus'])}>
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                  {orders.length === 0 ? <p className="empty-state">No orders found.</p> : null}
                </div>
              </section>

              <section className="panel" id="inventory-audit">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Inventory audit</p>
                    <h2>Adjust stock</h2>
                  </div>
                </div>
                <form className="form-grid" onSubmit={handleAdjustment}>
                  <div className="two-cols">
                    <label>
                      Product ID
                      <input value={adjustment.productId} onChange={(event) => setAdjustment({ ...adjustment, productId: event.target.value })} type="number" min="1" />
                    </label>
                    <label>
                      Quantity change
                      <input value={adjustment.quantityChange} onChange={(event) => setAdjustment({ ...adjustment, quantityChange: event.target.value })} type="number" step="1" />
                    </label>
                  </div>
                  <label>
                    Note
                    <input value={adjustment.note} onChange={(event) => setAdjustment({ ...adjustment, note: event.target.value })} />
                  </label>
                  <button disabled={loading} type="submit">Create adjustment</button>
                </form>
                <div className="order-list">
                  {movements.map((movement) => (
                    <article key={movement.id} className="order-card">
                      <strong>{movement.productName}</strong>
                      <p className="muted">{movement.type} · {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</p>
                      <p className="muted">Stock {movement.stockBefore} → {movement.stockAfter}</p>
                      <p className="muted">{movement.note ?? '-'}</p>
                    </article>
                  ))}
                  {movements.length === 0 ? <p className="empty-state">No movements found.</p> : null}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}

      {error ? <p className="status error">{error}</p> : null}
      {message ? <p className="status success">{message}</p> : null}
    </main>
  )
}

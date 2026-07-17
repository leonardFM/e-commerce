"use client"

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  fetchProducts,
  loginAdmin,
  removeProduct,
  updateProduct,
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

export default function AdminPage() {
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem('admin-token') ?? ''))
  const [email, setEmail] = useState('admin@solutech.test')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [products, setProducts] = useState<ProductItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<ProductFormState>(emptyForm())

  const isEditing = useMemo(() => form.id !== null, [form.id])

  useEffect(() => {
    if (!token) return

    const timer = window.setTimeout(async () => {
      try {
        setError('')
        const result = await fetchProducts(token, { page, limit: 8, search })
        setProducts(result.items)
        setTotalPages(result.meta.totalPages)
        setTotalProducts(result.meta.total)
      } catch (err) {
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
    setMessage('Signed out')
  }

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Product Management</h1>
          <p className="lede">Simple CRUD untuk admin dengan JWT bearer token.</p>
        </div>
        {token ? (
          <button className="ghost-button" onClick={logout} type="button">Logout</button>
        ) : null}
      </section>

      {!token ? (
        <section className="auth-card">
          <h2>Login</h2>
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
            </div>

            <nav className="sidebar-nav">
              <a href="#overview">Overview</a>
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
                <h2>Manage products</h2>
                <p className="muted">Create, edit, search, paginate, and soft delete from one place.</p>
              </div>
              <input className="search-input" placeholder="Search by name" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
            </div>

            <div className="dashboard-grid">
              <section className="panel" id="editor">
                <div className="panel-header">
                  <h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2>
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
                  <h2>Products</h2>
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
                          <td>Rp {product.price.toLocaleString('id-ID')}</td>
                          <td>{product.stock}</td>
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
            </div>
          </section>
        </div>
      )}

      {error ? <p className="status error">{error}</p> : null}
      {message ? <p className="status success">{message}</p> : null}
    </main>
  )
}

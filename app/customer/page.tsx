"use client"

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  addCustomerCartItem,
  checkoutCustomerCart,
  fetchCustomerCart,
  fetchCustomerOrders,
  fetchCustomerProducts,
  loginCustomer,
  updateCustomerCartItem,
  type CheckoutInput,
  type CustomerCart,
  type CustomerOrder,
  type CustomerProduct,
} from '@/lib/customer-api'

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CustomerPage() {
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem('customer-token') ?? ''))
  const [email, setEmail] = useState('customer@solutech.test')
  const [password, setPassword] = useState('password123')
  const [products, setProducts] = useState<CustomerProduct[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [cart, setCart] = useState<CustomerCart | null>(null)
  const [checkoutForm, setCheckoutForm] = useState<CheckoutInput>({
    paymentMethod: 'EWALLET',
    shippingName: 'Solutech Customer',
    shippingPhone: '08123456789',
    shippingAddress: 'Jl. Contoh No. 1',
    shippingCity: 'Jakarta',
    shippingPostalCode: '12345',
    shippingCost: 0,
    simulatePaymentStatus: undefined,
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const cartTotal = cart?.total ?? 0
  const cartCount = useMemo(() => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [cart])

  useEffect(() => {
    if (!token) return

    const timer = window.setTimeout(async () => {
      try {
        setError('')
        const [productResult, orderResult, cartResult] = await Promise.all([
          fetchCustomerProducts(token, { page, limit: 8, search }),
          fetchCustomerOrders(token),
          fetchCustomerCart(token),
        ])
        setProducts(productResult.items)
        setTotalPages(productResult.meta.totalPages)
        setOrders(orderResult)
        setCart(cartResult)
      } catch (err) {
        if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
          window.localStorage.removeItem('customer-token')
          setToken('')
          setProducts([])
          setOrders([])
          setCart(null)
        }
        setError(err instanceof Error ? err.message : 'Failed to load customer dashboard')
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
      const result = await loginCustomer(email, password)
      if (result.user.role !== 'CUSTOMER') {
        throw new Error('Only customer users can access this dashboard')
      }

      setToken(result.token)
      window.localStorage.setItem('customer-token', result.token)
      setMessage(`Signed in as ${result.user.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    window.localStorage.removeItem('customer-token')
    setToken('')
    setProducts([])
    setOrders([])
    setCart(null)
    setMessage('Signed out')
  }

  async function addToCart(product: CustomerProduct) {
    if (product.stock <= 0) return
    if (!token) return
    setError('')
    setCart(await addCustomerCartItem(token, product.id, 1))
  }

  async function updateQuantity(productId: number, quantity: number) {
    if (!token) return
    setError('')
    setCart(await updateCustomerCartItem(token, productId, quantity))
  }

  async function checkout() {
    if (!token || !cart || cart.items.length === 0) return
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await checkoutCustomerCart(token, checkoutForm)
      const [productResult, orderResult, cartResult] = await Promise.all([
        fetchCustomerProducts(token, { page, limit: 8, search }),
        fetchCustomerOrders(token),
        fetchCustomerCart(token),
      ])
      setProducts(productResult.items)
      setTotalPages(productResult.meta.totalPages)
      setOrders(orderResult)
      setCart(cartResult)
      setMessage(`Checkout berhasil. Order #${result.order.id} (${result.payment.paymentStatus}) sudah masuk riwayat.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Customer dashboard</p>
          <h1>Shop, cart, checkout.</h1>
          <p className="lede">Dashboard customer untuk belanja katalog aktif dan memantau riwayat order.</p>
        </div>
        {token ? <button className="ghost-button" onClick={logout} type="button">Logout</button> : null}
      </section>

      {!token ? (
        <section className="auth-card customer-auth-card">
          <p className="eyebrow">Customer access</p>
          <h2>Login customer</h2>
          <p className="muted">Gunakan akun customer. Akun admin akan ditolak dari dashboard ini.</p>
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
        </section>
      ) : (
        <div className="customer-shell">
          <aside className="customer-cart panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Cart</p>
                <h2>{cartCount} items</h2>
              </div>
              <strong>{formatMoney(cartTotal)}</strong>
            </div>
            <div className="cart-list">
              {cart?.items.map((item) => (
                <article key={item.productId} className="cart-item">
                  <div>
                    <strong>{item.productName}</strong>
                    <p className="muted">{formatMoney(item.unitPrice)} each</p>
                  </div>
                  <div className="quantity-control">
                    <button className="ghost-button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} type="button">-</button>
                    <span>{item.quantity}</span>
                    <button className="ghost-button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} type="button">+</button>
                  </div>
                </article>
              ))}
              {!cart || cart.items.length === 0 ? <p className="empty-state">Cart masih kosong.</p> : null}
            </div>
            <div className="form-grid">
              <label>
                Payment
                <select value={checkoutForm.paymentMethod} onChange={(event) => setCheckoutForm({ ...checkoutForm, paymentMethod: event.target.value as CheckoutInput['paymentMethod'] })}>
                  <option value="EWALLET">EWALLET</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="COD">COD</option>
                </select>
              </label>
              <label>
                Simulate
                <select value={checkoutForm.simulatePaymentStatus ?? ''} onChange={(event) => setCheckoutForm({ ...checkoutForm, simulatePaymentStatus: event.target.value ? event.target.value as CheckoutInput['simulatePaymentStatus'] : undefined })}>
                  <option value="">Default</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </label>
              <label>
                Shipping name
                <input value={checkoutForm.shippingName} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingName: event.target.value })} />
              </label>
              <label>
                Phone
                <input value={checkoutForm.shippingPhone} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingPhone: event.target.value })} />
              </label>
              <label>
                Address
                <textarea value={checkoutForm.shippingAddress} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingAddress: event.target.value })} rows={3} />
              </label>
              <div className="two-cols">
                <label>
                  City
                  <input value={checkoutForm.shippingCity} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingCity: event.target.value })} />
                </label>
                <label>
                  Postal code
                  <input value={checkoutForm.shippingPostalCode} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingPostalCode: event.target.value })} />
                </label>
              </div>
              <label>
                Shipping cost
                <input type="number" min="0" value={checkoutForm.shippingCost} onChange={(event) => setCheckoutForm({ ...checkoutForm, shippingCost: Number(event.target.value) })} />
              </label>
            </div>
            <button disabled={loading || !cart || cart.items.length === 0} onClick={checkout} type="button">{loading ? 'Processing...' : 'Checkout order'}</button>
          </aside>

          <section className="customer-content">
            <div className="dashboard-topbar">
              <div>
                <p className="eyebrow">Catalog</p>
                <h2>Produk aktif</h2>
                <p className="muted">Cari produk, tambah ke cart, lalu checkout dalam satu halaman.</p>
              </div>
              <input className="search-input" placeholder="Search products" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} />
            </div>

            <div className="customer-product-grid">
              {products.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-image compact">
                    <span>{product.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="product-body">
                    <div>
                      <div className="product-title-row">
                        <p className="product-name">{product.name}</p>
                        <span className={product.stock <= 10 ? 'stock-pill warning' : 'stock-pill'}>{product.stock} stok</span>
                      </div>
                      <p className="product-description">{product.description ?? 'Produk siap checkout.'}</p>
                    </div>
                    <div className="product-meta">
                      <strong>{formatMoney(product.price)}</strong>
                    </div>
                    <button disabled={product.stock <= 0} onClick={() => addToCart(product)} type="button">Add to cart</button>
                  </div>
                </article>
              ))}
              {products.length === 0 ? <div className="empty-collection">Produk tidak ditemukan.</div> : null}
            </div>

            <div className="pagination">
              <button className="ghost-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="ghost-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
            </div>

            <section className="panel order-history">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Order history</p>
                  <h2>{orders.length} orders</h2>
                </div>
              </div>
              <div className="order-list">
                {orders.map((order) => (
                  <article key={order.id} className="order-card">
                    <div>
                      <strong>Order #{order.id}</strong>
                      <p className="muted">{order.status} / {order.paymentStatus} · {new Date(order.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <strong>{formatMoney(order.total)}</strong>
                      <p className="muted">{order.items.length} product lines</p>
                    </div>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>{item.productName} × {item.quantity}</li>
                      ))}
                    </ul>
                  </article>
                ))}
                {orders.length === 0 ? <p className="empty-state">Belum ada order.</p> : null}
              </div>
            </section>
          </section>
        </div>
      )}

      {error ? <p className="status error">{error}</p> : null}
      {message ? <p className="status success">{message}</p> : null}
    </main>
  )
}

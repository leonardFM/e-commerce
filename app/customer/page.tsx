"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('customer-role') === 'CUSTOMER'
  })
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('customer-email') ?? ''
  })
  const [password, setPassword] = useState('')
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
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authenticated) return

    const timer = window.setTimeout(async () => {
      try {
        setError('')
        const [productResult, orderResult, cartResult] = await Promise.all([
          fetchCustomerProducts({ page, limit: 8, search }),
          fetchCustomerOrders(),
          fetchCustomerCart(),
        ])
        setProducts(productResult.items)
        setTotalPages(productResult.meta.totalPages)
        setOrders(orderResult)
        setCart(cartResult)
      } catch (err) {
        if (err instanceof Error && ((err as any).status === 401 || (err as any).status === 403)) {
          window.localStorage.removeItem('customer-role')
          window.localStorage.removeItem('customer-email')
          setAuthenticated(false)
          setProducts([])
          setOrders([])
          setCart(null)
          router.push('/customer')
        }
        setError(err instanceof Error ? err.message : 'Failed to load customer dashboard')
      }
    }, 200)

    return () => window.clearTimeout(timer)
  }, [authenticated, page, search])

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

      window.localStorage.removeItem('admin-role')
      window.localStorage.removeItem('admin-email')

      setAuthenticated(true)
      setEmail(result.user.email)
      window.localStorage.setItem('customer-role', result.user.role)
      window.localStorage.setItem('customer-email', result.user.email)
      setMessage(`Signed in as ${result.user.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.localStorage.removeItem('customer-role')
    window.localStorage.removeItem('customer-email')
    setAuthenticated(false)
    setProducts([])
    setOrders([])
    setCart(null)
    setMessage('Signed out')
  }

  async function addToCart(product: CustomerProduct) {
    if (product.stock <= 0) return
    setError('')
    try {
      setCart(await addCustomerCartItem(product.id, 1))
    } catch (err) {
      if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) logout()
      setError(err instanceof Error ? err.message : 'Failed to add item to cart')
    }
  }

  async function updateQuantity(productId: number, quantity: number) {
    setError('')
    try {
      setCart(await updateCustomerCartItem(productId, quantity))
    } catch (err) {
      if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) logout()
      setError(err instanceof Error ? err.message : 'Failed to update cart item')
    }
  }

  async function checkout() {
    if (!cart || cart.items.length === 0) return
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await checkoutCustomerCart(checkoutForm)
      const [productResult, orderResult, cartResult] = await Promise.all([
        fetchCustomerProducts({ page, limit: 8, search }),
        fetchCustomerOrders(),
        fetchCustomerCart(),
      ])
      setProducts(productResult.items)
      setTotalPages(productResult.meta.totalPages)
      setOrders(orderResult)
      setCart(cartResult)
      setMessage(`Checkout berhasil. Order #${result.order.id} (${result.payment.paymentStatus}) sudah masuk riwayat.`)
    } catch (err) {
      if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) logout()
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-page">
      {!mounted || !authenticated ? (
        <section className="auth-card customer-auth-card">
          <div className="auth-visual customer-auth-visual">
            <p className="eyebrow">Solutech Customer</p>
            <h1>Belanja lebih cepat.</h1>
            <p>Masuk untuk melihat katalog aktif, mengelola cart, checkout, dan memantau order.</p>
          </div>
          <div className="auth-form-card">
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
            <div className="auth-link-row">
              <span>Belum punya akun?</span>
              <Link className="ghost-button" href="/register">Daftar customer baru</Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="promo-bar">Customer area: katalog aktif, persistent cart, checkout, dan riwayat order.</div>

          <nav className="storefront-nav customer-storefront-nav">
            <Link className="brand-mark" href="/">
              <span>SC</span>
              <strong>Solutech Commerce</strong>
            </Link>
            <input className="market-search" placeholder="Cari produk di katalog customer..." value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} />
            <div className="nav-links">
              <a href="#customer-catalog">Katalog</a>
              <a href="#customer-orders">Order</a>
              <button className="ghost-button" onClick={logout} type="button">Logout</button>
            </div>
          </nav>

          <section className="storefront-hero customer-marketplace-hero">
            <div className="storefront-copy">
              <p className="eyebrow">Customer marketplace</p>
              <h1>Belanja produk aktif dalam satu dashboard.</h1>
              <p className="storefront-lede">Cari produk, tambah ke cart, atur pengiriman, checkout, dan pantau order tanpa keluar halaman.</p>
            </div>
            <div className="hero-promo-card">
              <span className="product-badge">Cart summary</span>
              <h2>{cartCount} item</h2>
              <p>Total belanja aktif di cart customer.</p>
              <div className="hero-price-row">
                <strong>{formatMoney(cartTotal)}</strong>
                <span>{orders.length} orders</span>
              </div>
            </div>
          </section>

          <div className="customer-shell">
          <aside className="customer-left-rail">
            <section className="customer-summary-card panel">
              <p className="eyebrow">Signed in</p>
              <h2>{email}</h2>
              <div className="summary-row"><span>Cart items</span><strong>{cartCount}</strong></div>
              <div className="summary-row"><span>Cart total</span><strong>{formatMoney(cartTotal)}</strong></div>
              <button className="ghost-button" onClick={logout} type="button">Logout</button>
            </section>

          <section className="customer-cart panel" id="checkout-panel">
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
          </section>
          </aside>

          <section className="customer-content">
            <div className="dashboard-topbar" id="customer-catalog">
              <div>
                <p className="eyebrow">Catalog</p>
                <h2>Produk aktif</h2>
                <p className="muted">Cari produk, tambah ke cart, lalu checkout dalam satu halaman.</p>
              </div>
              <span className="stock-pill">{products.length} shown</span>
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

            <section className="panel order-history" id="customer-orders">
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
        </>
      )}

      {error ? <p className="status error">{error}</p> : null}
      {message ? <p className="status success">{message}</p> : null}
    </main>
  )
}

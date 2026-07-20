"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { registerCustomer } from '@/lib/customer-api'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await registerCustomer(email, password, name)
      if (result.user.role !== 'CUSTOMER') {
        throw new Error('Only customer users can access this dashboard')
      }

      window.localStorage.removeItem('admin-role')
      window.localStorage.removeItem('admin-email')

      window.localStorage.setItem('customer-role', result.user.role)
      window.localStorage.setItem('customer-email', result.user.email)
      router.push('/customer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-page">
      <section className="auth-card customer-auth-card">
        <div className="auth-visual customer-auth-visual">
          <p className="eyebrow">Solutech Customer</p>
          <h1>Buat akun customer.</h1>
          <p>Daftar untuk menyimpan cart, checkout produk aktif, dan memantau riwayat order dari dashboard customer.</p>
        </div>

        <div className="auth-form-card">
          <p className="eyebrow">Customer registration</p>
          <h2>Register customer</h2>
          <p className="muted">Akun baru otomatis dibuat sebagai customer dan langsung masuk ke dashboard.</p>
          <form className="form-grid" onSubmit={handleRegister}>
            <label>
              Name
              <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} type="text" />
            </label>
            <label>
              Email
              <input required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>
            <label>
              Password
              <input required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
            </label>
            <button disabled={loading} type="submit">{loading ? 'Creating account...' : 'Create account'}</button>
          </form>

          <div className="auth-link-row">
            <span>Sudah punya akun?</span>
            <Link className="ghost-button" href="/customer">Login customer</Link>
          </div>
          <Link className="auth-home-link" href="/">Kembali ke homepage</Link>
        </div>
      </section>

      {error ? <p className="status error">{error}</p> : null}
    </main>
  )
}

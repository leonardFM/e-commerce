import Link from 'next/link'

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Next.js App Router</p>
        <h1>Solutech Commerce</h1>
        <p className="lede">
          Backend ready. Open the admin panel to manage products.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/admin">Open Admin</Link>
        </div>
      </section>
    </main>
  )
}

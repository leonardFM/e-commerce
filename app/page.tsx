import Link from 'next/link'
import { prisma } from '@/lib/prisma'

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

const highlights = [
  { label: 'Secure checkout', value: '24/7' },
  { label: 'Delivery coverage', value: 'Nationwide' },
  { label: 'Customer rating', value: '4.9/5' },
]

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  return (
    <main className="storefront-page">
      <section className="storefront-hero">
        <div className="storefront-copy">
          <p className="eyebrow">Solutech Commerce</p>
          <h1>Premium shopping, built for speed and trust.</h1>
          <p className="storefront-lede">
            A polished e-commerce storefront for discovering quality products, trusted service,
            and a clean buying experience.
          </p>
          <div className="storefront-actions">
            <Link className="primary-button" href="#featured">Shop featured</Link>
            <Link className="ghost-button" href="/admin">Admin dashboard</Link>
          </div>
          <div className="storefront-highlights">
            {highlights.map((item) => (
              <article key={item.label} className="highlight-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="storefront-visual">
          <div className="floating-card floating-card-main">
            <span className="sidebar-label">Featured offer</span>
            <strong>Next day dispatch</strong>
            <p>Fast fulfillment for top-selling essentials and lifestyle products.</p>
          </div>
          <div className="floating-card floating-card-secondary">
            <span className="sidebar-label">Member deal</span>
            <strong>Up to 25% off</strong>
            <p>Selected products for registered customers.</p>
          </div>
        </div>
      </section>

      <section className="storefront-strip">
        <div>
          <span className="sidebar-label">Trusted by shoppers</span>
          <strong>Fast, modern, and easy to navigate</strong>
        </div>
        <div>
          <span className="sidebar-label">Support</span>
          <strong>Live assistance and transparent tracking</strong>
        </div>
        <div>
          <span className="sidebar-label">Catalog</span>
          <strong>Curated essentials with clear pricing</strong>
        </div>
      </section>

      <section className="storefront-section" id="featured">
        <div className="section-heading">
          <p className="eyebrow">Featured products</p>
          <h2>Selected from our latest collection</h2>
          <p>Popular items ready for shopping directly from the homepage.</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <article key={product.id} className="product-card">
              <div className="product-image">
                <span>0{index + 1}</span>
              </div>
              <div className="product-body">
                <div>
                  <p className="product-name">{product.name}</p>
                  <p className="product-description">{product.description ?? 'Quality product with reliable stock.'}</p>
                </div>
                <div className="product-meta">
                  <strong>{formatMoney(product.price)}</strong>
                  <span>{product.stock} in stock</span>
                </div>
              </div>
            </article>
          ))}
          {featuredProducts.length === 0 ? (
            <div className="empty-collection">
              <p>No products yet. Seed the database to show featured items here.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="storefront-banner">
        <div>
          <p className="eyebrow">For operators</p>
          <h2>Manage inventory from the admin panel.</h2>
        </div>
        <Link className="primary-button" href="/admin">Open admin</Link>
      </section>
    </main>
  )
}

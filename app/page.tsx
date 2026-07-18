import Link from 'next/link'
import { prisma } from '@/lib/prisma'

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

const benefits = [
  { label: 'Same day dispatch', value: '24h', detail: 'Produk siap dikirim dari stok aktif.' },
  { label: 'Secure checkout', value: 'JWT', detail: 'Sesi customer terlindungi untuk order.' },
  { label: 'Curated catalog', value: '100%', detail: 'Katalog bersih tanpa produk soft-deleted.' },
]

const categories = ['Tech essentials', 'Work setup', 'Accessories', 'Daily deals']

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const totalStock = featuredProducts.reduce((sum, product) => sum + product.stock, 0)

  return (
    <main className="storefront-page">
      <nav className="storefront-nav">
        <Link className="brand-mark" href="/">
          <span>SC</span>
          <strong>Solutech Commerce</strong>
        </Link>
        <div className="nav-links">
          <a href="#categories">Categories</a>
          <a href="#featured">Featured</a>
          <Link href="/customer">Customer</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="storefront-hero">
        <div className="storefront-copy">
          <p className="eyebrow">Modern online store</p>
          <h1>Belanja cepat untuk kebutuhan digital harian.</h1>
          <p className="storefront-lede">
            Temukan produk pilihan, cek stok real-time, dan checkout melalui dashboard customer yang aman.
            Admin dapat mengelola katalog dari panel profesional yang terpisah.
          </p>
          <div className="storefront-actions">
            <Link className="primary-button" href="/customer">Mulai belanja</Link>
            <Link className="ghost-button" href="#featured">Lihat produk</Link>
          </div>
          <div className="storefront-highlights">
            {benefits.map((item) => (
              <article key={item.label} className="highlight-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="storefront-visual">
          <div className="hero-product-card">
            <span className="product-badge">Featured drop</span>
            <h2>{featuredProducts[0]?.name ?? 'Solutech Essentials'}</h2>
            <p>{featuredProducts[0]?.description ?? 'Produk unggulan siap tampil setelah database di-seed.'}</p>
            <div className="hero-price-row">
              <strong>{featuredProducts[0] ? formatMoney(featuredProducts[0].price) : 'Rp 0'}</strong>
              <span>{featuredProducts[0]?.stock ?? 0} stock</span>
            </div>
          </div>
          <div className="floating-card floating-card-main">
            <span className="sidebar-label">Catalog health</span>
            <strong>{featuredProducts.length} featured items</strong>
            <p>{totalStock} total stock ready from the latest collection.</p>
          </div>
          <div className="floating-card floating-card-secondary">
            <span className="sidebar-label">Customer area</span>
            <strong>Cart + orders</strong>
            <p>Login sebagai customer untuk checkout dan melihat riwayat pembelian.</p>
          </div>
        </div>
      </section>

      <section className="category-strip" id="categories">
        {categories.map((category) => (
          <article key={category}>
            <span className="sidebar-label">Shop</span>
            <strong>{category}</strong>
          </article>
        ))}
      </section>

      <section className="storefront-section" id="featured">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow">Featured products</p>
            <h2>Produk terbaru dari katalog aktif</h2>
            <p>Pilih produk dan lanjutkan ke dashboard customer untuk membuat order.</p>
          </div>
          <Link className="ghost-button" href="/customer">Buka customer dashboard</Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <article key={product.id} className="product-card">
              <div className="product-image">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="product-body">
                <div>
                  <div className="product-title-row">
                    <p className="product-name">{product.name}</p>
                    <span className="stock-pill">{product.stock > 0 ? 'Ready' : 'Sold out'}</span>
                  </div>
                  <p className="product-description">{product.description ?? 'Produk berkualitas dengan stok terpercaya.'}</p>
                </div>
                <div className="product-meta">
                  <strong>{formatMoney(product.price)}</strong>
                  <span>{product.stock} stok</span>
                </div>
                <Link className="product-cta" href="/customer">Shop now</Link>
              </div>
            </article>
          ))}
          {featuredProducts.length === 0 ? (
            <div className="empty-collection">
              <p>Belum ada produk. Jalankan seed database untuk menampilkan katalog.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="storefront-banner">
        <div>
          <p className="eyebrow">Operate with confidence</p>
          <h2>Kelola produk dan stok dari dashboard admin profesional.</h2>
          <p>Panel admin terpisah dengan role guard untuk menjaga operasi katalog.</p>
        </div>
        <Link className="primary-button" href="/admin">Open admin</Link>
      </section>
    </main>
  )
}

import Link from 'next/link'
import { listFeaturedProductsService } from '@/modules/products/product.service'

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

const benefits = [
  { label: 'Gratis simulasi ongkir', value: 'Checkout aman', detail: 'Pilih payment method dan alamat langsung dari customer dashboard.' },
  { label: 'Stok real-time', value: 'Ready stock', detail: 'Katalog hanya menampilkan produk aktif yang siap dipesan.' },
  { label: 'Admin terpisah', value: 'Panel operasi', detail: 'Kelola produk, order, dan inventory dari dashboard profesional.' },
]

const categories = ['Elektronik', 'Peralatan kerja', 'Aksesoris', 'Daily deals', 'Smart living', 'Office setup']

export default async function Home() {
  const featuredProducts = await listFeaturedProductsService()
  const totalStock = featuredProducts.reduce((sum, product) => sum + product.stock, 0)
  const firstProduct = featuredProducts[0]

  return (
    <main className="storefront-page">
      <div className="promo-bar">Promo Solutech: katalog aktif, checkout aman, dan dashboard admin siap pakai.</div>

      <nav className="storefront-nav">
        <Link className="brand-mark" href="/">
          <span>SC</span>
          <strong>Solutech Commerce</strong>
        </Link>
        <div className="market-search">Cari produk, kategori, atau kebutuhan kantor...</div>
        <div className="nav-links">
          <a href="#categories">Kategori</a>
          <a href="#featured">Produk</a>
          <Link href="/customer">Customer</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="storefront-hero">
        <div className="storefront-copy">
          <p className="eyebrow">Marketplace pilihan Solutech</p>
          <h1>Belanja kebutuhan digital dan kerja jadi lebih mudah.</h1>
          <p className="storefront-lede">
            Jelajahi produk unggulan, cek stok siap kirim, tambah ke cart, dan lanjut checkout dari dashboard customer.
          </p>
          <div className="storefront-actions">
            <Link className="primary-button" href="/customer">Mulai belanja</Link>
            <Link className="ghost-button" href="#featured">Lihat produk</Link>
          </div>
        </div>

        <div className="hero-promo-card">
          <span className="product-badge">Promo utama</span>
          <h2>{firstProduct?.name ?? 'Solutech Essentials'}</h2>
          <p>{firstProduct?.description ?? 'Produk unggulan akan tampil setelah database di-seed.'}</p>
          <div className="hero-price-row">
            <strong>{firstProduct ? formatMoney(firstProduct.price) : 'Rp 0'}</strong>
            <span>{firstProduct?.stock ?? 0} stok</span>
          </div>
        </div>
      </section>

      <section className="category-strip" id="categories">
        {categories.map((category) => (
          <article key={category}>
            <span className="category-icon">{category.slice(0, 2).toUpperCase()}</span>
            <strong>{category}</strong>
            <small>Belanja sekarang</small>
          </article>
        ))}
      </section>

      <section className="storefront-highlights">
        {benefits.map((item) => (
          <article key={item.label} className="highlight-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="storefront-section" id="featured">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow">Produk unggulan</p>
            <h2>Rekomendasi dari katalog aktif</h2>
            <p>{featuredProducts.length} produk unggulan dengan total {totalStock} stok siap dipesan.</p>
          </div>
          <Link className="ghost-button" href="/customer">Buka dashboard customer</Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image">
                <span>{product.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="product-body">
                <div className="product-title-row">
                  <p className="product-name">{product.name}</p>
                  <span className={product.stock <= 10 ? 'stock-pill warning' : 'stock-pill'}>{product.stock > 0 ? 'Ready' : 'Habis'}</span>
                </div>
                <p className="product-description">{product.description ?? 'Produk berkualitas dengan stok terpercaya.'}</p>
                <div className="product-meta">
                  <strong>{formatMoney(product.price)}</strong>
                  <span>{product.stock} stok</span>
                </div>
                <Link className="product-cta" href="/customer">Tambah ke cart</Link>
              </div>
            </article>
          ))}
          {featuredProducts.length === 0 ? (
            <div className="empty-collection">Belum ada produk. Jalankan seed database untuk menampilkan katalog.</div>
          ) : null}
        </div>
      </section>

      <section className="storefront-banner">
        <div>
          <p className="eyebrow">Dashboard lengkap</p>
          <h2>Belanja sebagai customer atau kelola toko sebagai admin.</h2>
          <p>Customer dashboard untuk cart dan checkout. Admin dashboard untuk katalog, order, dan inventory.</p>
        </div>
        <div className="storefront-actions">
          <Link className="primary-button" href="/customer">Customer</Link>
          <Link className="ghost-button" href="/admin">Admin</Link>
        </div>
      </section>
    </main>
  )
}

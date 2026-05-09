import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api-client'
import { formatPrice } from '../lib/format'

interface Overview { totalProducts: number; brandCount: number; sourceCount: number; brands: { name: string; count: number }[]; lastUpdated: string | null; recentProducts: { id: number; title: string; brand: string; price: string; currency: string; imageUrl: string | null }[] }

export default function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const nav = useNavigate()

  useEffect(() => {
    api('/api/products/overview').then(r => r.json()).then(d => { if (d.success) setOverview(d.data) }).catch(() => {})
  }, [])

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (keyword.trim()) nav(`/search?q=${encodeURIComponent(keyword.trim())}`)
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      {/* Header */}
      <header
        style={{
          height: 'var(--header-height)',
          padding: '0 var(--page-padding)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'var(--border-width) solid var(--border-default)',
          marginLeft: 'calc(-1 * var(--page-padding))',
          marginRight: 'calc(-1 * var(--page-padding))',
        }}
      >
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span
          style={{
            width: '18px', height: '18px', borderRadius: '999px',
            display: 'grid', placeItems: 'center',
            background: 'var(--brand)', color: 'var(--text-inverse)',
            fontSize: '11px', fontWeight: 800, letterSpacing: '0',
          }}
        >01</span>
      </header>

      {/* Title area */}
      <section
        style={{
          padding: '14px var(--page-padding) 10px',
          borderBottom: 'var(--border-width) solid var(--border-default)',
          marginLeft: 'calc(-1 * var(--page-padding))',
          marginRight: 'calc(-1 * var(--page-padding))',
        }}
      >
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 8vw, 32px)',
          lineHeight: '0.88',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          textTransform: 'uppercase',
          maxWidth: '260px',
          margin: 0,
        }}>
          Brands
        </h1>
        <form onSubmit={search}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px', display: 'block' }}>
              Enter Brand Keyword
            </span>
            <input
              style={{
                width: '100%', marginTop: '4px', border: '0', padding: '0',
                background: 'transparent', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px',
                fontWeight: 500, textTransform: 'uppercase',
                outline: 'none', caretColor: 'var(--text-primary)',
              }}
              placeholder="BRAND NAME_"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </label>
        </form>
      </section>

      {/* Stats */}
      {overview ? (
        <>
          <div
            style={{
              padding: '12px var(--page-padding)',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
              borderBottom: 'var(--border-width) solid var(--border-default)',
              marginLeft: 'calc(-1 * var(--page-padding))',
              marginRight: 'calc(-1 * var(--page-padding))',
            }}
          >
            <div style={{ background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-default)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.totalProducts}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px' }}>Items</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-default)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.brandCount}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px' }}>Brands</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-default)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.sourceCount}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px' }}>Sources</div>
            </div>
          </div>

          {/* Recent products */}
          {overview.recentProducts?.length > 0 && (
            <div>
              {overview.recentProducts.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => nav(`/product/${p.id}`)}
                  style={{
                    height: 'var(--row-height)',
                    display: 'grid',
                    gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto 24px',
                    borderBottom: 'var(--border-width) solid var(--border-default)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left' as const,
                    padding: 0,
                  }}
                >
                  <img
                    src={p.imageUrl || `https://placehold.co/72x92/B8B8AD/5C5D55?text=${encodeURIComponent(p.brand.slice(0, 4))}`}
                    alt=""
                    style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover', border: 'var(--border-width) solid var(--border-default)' }}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/72x92/B8B8AD/5C5D55?text=N/A` }}
                  />
                  <div style={{ minWidth: 0, padding: '12px 6px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h2 style={{
                      margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px',
                      lineHeight: '13px', fontWeight: 900, letterSpacing: '-0.02em',
                      textTransform: 'uppercase', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{p.title}</h2>
                    <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.88 }}>
                      {p.brand}
                    </div>
                  </div>
                  <div style={{ alignSelf: 'end', padding: '0 6px 10px 0', fontSize: '15px', lineHeight: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {formatPrice(p.currency, p.price)}
                  </div>
                  <div style={{
                    width: '18px', height: '18px', marginTop: '10px', marginRight: '6px',
                    border: '1px solid currentColor', borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    fontSize: '10px', lineHeight: '1', fontWeight: 800,
                  }}>{String.fromCharCode(65 + i)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Brand grid */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              All Brands
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px' }}>
              {overview.brands.map(b => (
                <button
                  key={b.name}
                  onClick={() => nav(`/search?q=${encodeURIComponent(b.name)}&brand=${encodeURIComponent(b.name)}`)}
                  style={{
                    background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
                    padding: '12px 8px', textAlign: 'left' as const, cursor: 'pointer',
                    minHeight: '56px', width: '100%',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{b.name}</div>
                  <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.88, marginTop: '4px' }}>{b.count} ITEMS</div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '24px var(--page-padding)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading...</div>
        </div>
      )}
    </div>
  )
}

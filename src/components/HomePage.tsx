import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api-client'
import { formatPrice, getPlaceholderUrl } from '../lib/format'

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
    <div style={{ padding: 'var(--page-padding)', paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
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
          品牌
        </h1>
        <form onSubmit={search}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px', display: 'block' }}>
              输入品牌关键词
            </span>
            <input
              style={{
                width: '100%', marginTop: '4px', border: '0', padding: '0',
                background: 'transparent', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px',
                fontWeight: 500, textTransform: 'uppercase',
                outline: 'none', caretColor: 'var(--text-primary)',
              }}
              placeholder="品牌名称_"
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
              padding: '10px var(--page-padding)',
              display: 'flex', gap: '12px',
              borderBottom: 'var(--border-width) solid var(--border-default)',
              marginLeft: 'calc(-1 * var(--page-padding))',
              marginRight: 'calc(-1 * var(--page-padding))',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.totalProducts}</span>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>商品</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.brandCount}</span>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>品牌</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, lineHeight: '1', color: 'var(--brand)' }}>{overview.sourceCount}</span>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>来源</span>
            </div>
          </div>

          {/* Recent products */}
          {overview.recentProducts?.length > 0 && (
            <div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.7 }}>
                最近添加
              </div>
              {overview.recentProducts.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => nav(`/product/${p.id}`)}
                  style={{
                    minHeight: 'var(--row-height)',
                    display: 'grid',
                    gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto',
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
                    src={p.imageUrl || getPlaceholderUrl(p.brand, 72, 92)}
                    alt=""
                    style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover', border: 'var(--border-width) solid var(--border-default)' }}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 72, 92) }}
                  />
                  <div style={{ minWidth: 0, padding: '12px 8px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h2 style={{
                      margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px',
                      lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em',
                      textTransform: 'uppercase', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{p.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.88 }}>{p.brand}</span>
                      <span style={{ fontSize: '15px', lineHeight: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{formatPrice(p.currency, p.price)}</span>
                    </div>
                  </div>
                  <div style={{
                    width: '18px', height: '18px', marginTop: '10px', marginRight: '6px',
                    border: '1px solid currentColor', borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    fontSize: '10px', lineHeight: '1', fontWeight: 800,
                  }}>{String(i + 1).padStart(2, '0')}</div>
                </button>
              ))}
            </div>
          )}

          {/* Brand grid */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              全部品牌
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px' }}>
              {overview.brands.map(b => (
                <button
                  key={b.name}
                  onClick={() => nav(`/search?q=${encodeURIComponent(b.name)}&brand=${encodeURIComponent(b.name)}`)}
                  style={{
                    background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
                    padding: '12px 10px', cursor: 'pointer',
                    minHeight: '72px', width: '100%',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{b.name}</div>
                    <div style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, marginTop: '4px' }}>{b.count} 件商品</div>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 700, opacity: 0.3 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '24px var(--page-padding)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>加载中...</div>
        </div>
      )}
    </div>
  )
}

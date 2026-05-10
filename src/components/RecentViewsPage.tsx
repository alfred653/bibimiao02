import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, stripBrandPrefix, getPlaceholderUrl } from '../lib/format'

interface RecentItem {
  id: number; title: string; brand: string; price: string; currency: string; imageUrl: string | null; viewedAt: number
}
function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem('bbm_recent_views') || '[]') } catch { return [] }
}

export default function RecentViewsPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<RecentItem[]>(loadRecent)

  function clearAll() { localStorage.removeItem('bbm_recent_views'); setItems([]) }
  function removeOne(id: number) {
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('bbm_recent_views', JSON.stringify(next)); setItems(next)
  }
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'; if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '11px', fontWeight: 800 }}>06</span>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>最近<br />浏览</h1>
        {items.length > 0 && (
          <button onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>清除全部</button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>暂无浏览记录</p>
        </div>
      ) : (
        <div>
          {items.map(p => (
            <div key={p.id} style={{ height: 'var(--row-height)', display: 'grid', gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto 28px', borderBottom: 'var(--border-width) solid var(--border-default)', cursor: 'pointer' }}
              onClick={() => nav(`/product/${p.id}`)}>
              <img src={p.imageUrl || getPlaceholderUrl('N/A', 72, 92)} alt="" loading="lazy"
                style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 72, 92) }} />
              <div style={{ minWidth: 0, padding: '12px 6px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px', lineHeight: '13px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripBrandPrefix(p.title, p.brand)}</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)' }}>{p.brand}</span>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{timeAgo(p.viewedAt)}</span>
                </div>
              </div>
              <div style={{ alignSelf: 'end', padding: '0 4px 10px 0', fontSize: '13px', lineHeight: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatPrice(p.currency, p.price)}</div>
              <button onClick={e => { e.stopPropagation(); removeOne(p.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '8px 4px', alignSelf: 'start' }} aria-label="Remove">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, stripBrandPrefix, getPlaceholderUrl } from '../lib/format'
import { useToast } from './Toast'
import { api } from '../lib/api-client'

interface RecentItem {
  id: number; title: string; brand: string; price: string; currency: string; imageUrl: string | null; viewedAt: number
}
function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem('bbm_recent_views') || '[]') } catch { return [] }
}

export default function RecentViewsPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<RecentItem[]>(loadRecent)
  const { toast } = useToast()
  const [displayCurrency, setDisplayCurrency] = useState('CNY')
  const [rates, setRates] = useState<Record<string, { rate: number }>>({})
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('bbm_exchange_settings') || '{}')
      if (settings.preferredCurrency) setDisplayCurrency(settings.preferredCurrency)
    } catch {}
  }, [])

  useEffect(() => {
    if (!items.length) return
    const currencies = [...new Set(items.map(i => i.currency).filter(c => c && c !== displayCurrency))]
    if (!currencies.length) return
    Promise.all(
      currencies.map(cur =>
        api(`/api/exchange-rate?from=${encodeURIComponent(cur)}&to=${encodeURIComponent(displayCurrency)}`)
          .then(r => r.json()).then(d => {
            if (d.success) return { cur, rate: d.data.rate }
            return null
          }).catch(() => null)
      )
    ).then(results => {
      const map: Record<string, { rate: number }> = {}
      results.filter(Boolean).forEach((r: any) => { map[r.cur] = { rate: r.rate } })
      setRates(map)
    })
  }, [items, displayCurrency])

  function clearAll() { localStorage.removeItem('bbm_recent_views'); setItems([]); setConfirmClear(false) }
  function removeOne(id: number) {
    const item = items.find(i => i.id === id)
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('bbm_recent_views', JSON.stringify(next)); setItems(next)
    if (item) {
      toast('已移除', 'success', {
        label: '撤销',
        onClick: () => {
          const restored = [item, ...next].slice(0, 20)
          localStorage.setItem('bbm_recent_views', JSON.stringify(restored))
          setItems(restored)
          toast('已恢复', 'success')
        }
      })
    }
  }
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'; if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  return (
    <div style={{ padding: 'var(--page-padding)', paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
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
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>最近浏览</h1>
        {items.length > 0 && (
          confirmClear ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)' }}>确认清空？</span>
              <button onClick={() => setConfirmClear(false)} style={{ background: 'none', border: 'none', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>取消</button>
              <button onClick={clearAll} style={{ background: 'transparent', border: '1px solid var(--danger)', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)', cursor: 'pointer', padding: '2px 8px' }}>确认清空</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} style={{ background: 'none', border: 'none', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>清除全部</button>
          )
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>暂无浏览记录</p>
        </div>
      ) : (
        <div>
          {items.map(p => (
            <div key={p.id} style={{ minHeight: 'var(--row-height)', display: 'grid', gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto', borderBottom: 'var(--border-width) solid var(--border-default)', cursor: 'pointer' }}
              onClick={() => nav(`/product/${p.id}`)}>
              <img src={p.imageUrl || getPlaceholderUrl('N/A', 72, 92)} alt="" loading="lazy"
                style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 72, 92) }} />
              <div style={{ minWidth: 0, padding: '12px 8px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripBrandPrefix(p.title, p.brand)}</h2>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)' }}>{p.brand}</span>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, whiteSpace: 'nowrap' }}>{timeAgo(p.viewedAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', lineHeight: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{formatPrice(p.currency, p.price)}</span>
                  {p.currency && p.currency !== displayCurrency && rates[p.currency] && (
                    <span style={{ fontSize: 'var(--fs-label)', fontWeight: 700, opacity: 0.6, whiteSpace: 'nowrap' }}>
                      ≈ {formatPrice(displayCurrency, Math.round(parseFloat(p.price) * rates[p.currency].rate * 100) / 100)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); removeOne(p.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', padding: 0, alignSelf: 'start', width: '44px', height: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Remove">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

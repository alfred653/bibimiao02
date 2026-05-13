import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { formatPrice, getPlaceholderUrl } from '../lib/format'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiPost, apiDelete } from '../lib/api-client'

export default function FavoritesPage() {
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()
  const nav = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [displayCurrency, setDisplayCurrency] = useState('CNY')
  const [rates, setRates] = useState<Record<string, { rate: number }>>({})
  const [sortBy, setSortBy] = useState('time_desc')
  const [filterBrand, setFilterBrand] = useState('')

  function loadFavorites() {
    api('/api/favorites').then(r => r.json()).then(d => { if (d.success) setItems(d.data.items) }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); setLoading(false); return }
    loadFavorites()
  }, [isSignedIn])

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('bbm_exchange_settings') || '{}')
      if (settings.preferredCurrency) setDisplayCurrency(settings.preferredCurrency)
    } catch {}
  }, [])

  useEffect(() => {
    if (!items.length) return
    const currencies = [...new Set(items.map((i: any) => i.currency).filter((c: string) => c && c !== displayCurrency))]
    if (!currencies.length) return
    Promise.all(
      currencies.map((cur: string) =>
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

  function removeFavorite(productId: number) {
    const item = items.find(it => it.id === productId)
    apiDelete('/api/favorites', { productId }).then(r => r.json()).then(d => {
      if (d.success) {
        setItems(prev => prev.filter(it => it.id !== productId))
        toast('已移除', 'success', {
          label: '撤销',
          onClick: () => {
            apiPost('/api/favorites', { productId }).then(r => r.json()).then(d2 => {
              if (d2.success && item) { setItems(prev => [...prev, item]); toast('已恢复', 'success') }
            }).catch(() => {})
          }
        })
      }
    }).catch(() => toast('网络错误', 'error'))
  }

  if (!isSignedIn) return <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>请先登录</div>

  return (
    <div style={{ padding: 'var(--page-padding)', paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '11px', fontWeight: 800 }}>05</span>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))', marginBottom: '0' }}>
        收藏<br />商品
      </h1>

      {loading ? <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>加载中...</div> :
       !items.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>暂无收藏商品</p>
          <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '16px' }}>浏览时点击心形图标即可收藏</p>
          <button onClick={() => nav('/search')} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '8px 24px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>去搜索</button>
        </div>
      ) : (() => {
        const brands = [...new Set(items.map(i => i.brand).filter(Boolean))]
        let displayItems = [...items]
        if (filterBrand) displayItems = displayItems.filter(i => i.brand === filterBrand)
        displayItems.sort((a, b) => {
          switch (sortBy) {
            case 'price_asc': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
            case 'price_desc': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
            case 'time_asc': return new Date(a.favoritedAt || 0).getTime() - new Date(b.favoritedAt || 0).getTime()
            case 'time_desc':
            default: return new Date(b.favoritedAt || 0).getTime() - new Date(a.favoritedAt || 0).getTime()
          }
        })
        return (
        <div>
          {/* Sort + Filter bar */}
          <div style={{ display: 'flex', gap: '8px', padding: '8px 0', alignItems: 'center' }}>
            {brands.length > 0 && (
              <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
                style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 10px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none', minHeight: '44px' }}>
                <option value="">全部品牌</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 10px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none', minHeight: '44px' }}>
              <option value="time_desc">收藏时间↓</option>
              <option value="time_asc">收藏时间↑</option>
              <option value="price_desc">价格↓</option>
              <option value="price_asc">价格↑</option>
            </select>
          </div>
          {displayItems.map(item => (
            <div key={item.id}
              onClick={() => nav(`/product/${item.id}`)}
              style={{
                minHeight: 'var(--row-height)', display: 'grid',
                gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto',
                borderBottom: 'var(--border-width) solid var(--border-default)',
                cursor: 'pointer', background: 'var(--bg-primary)',
              }}>
              <img src={item.imageUrl || getPlaceholderUrl('N/A', 72, 92)} alt="" loading="lazy"
                style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover', border: 'var(--border-width) solid var(--border-default)' }}
                onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 72, 92) }} />
              <div style={{ minWidth: 0, padding: '12px 8px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h2>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', whiteSpace: 'nowrap' }}>{item.brand}</span>
                  {item.source && <span style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{item.source}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', lineHeight: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{item.price ? formatPrice(item.currency, item.price) : '—'}</span>
                  {item.currency && item.currency !== displayCurrency && rates[item.currency] && (
                    <span style={{ fontSize: 'var(--fs-label)', fontWeight: 700, opacity: 0.6, whiteSpace: 'nowrap' }}>
                      ≈ {formatPrice(displayCurrency, Math.round(parseFloat(item.price) * rates[item.currency].rate * 100) / 100)}
                    </span>
                  )}
                </div>
                {item.favoritedAt && (
                  <div style={{ fontSize: 'var(--fs-label)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>
                    收藏于 {new Date(item.favoritedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric' })}
                  </div>
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFavorite(item.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', padding: '12px 10px', alignSelf: 'start', minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                title="取消收藏">×</button>
            </div>
          ))}
        </div>
        )
      })()}
    </div>
  )
}

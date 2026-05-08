import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, stripBrandPrefix } from '../lib/format'

interface RecentItem {
  id: number
  title: string
  brand: string
  price: string
  currency: string
  imageUrl: string | null
  viewedAt: number
}

function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem('bbm_recent_views') || '[]') } catch { return [] }
}

export default function RecentViewsPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<RecentItem[]>(loadRecent)

  function clearAll() {
    localStorage.removeItem('bbm_recent_views')
    setItems([])
  }

  function removeOne(id: number) {
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('bbm_recent_views', JSON.stringify(next))
    setItems(next)
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">最近浏览</h1>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-xs text-[var(--text-muted)] active:text-[var(--text-secondary)]">
            清除全部
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)] text-sm mb-2">暂无浏览记录</p>
          <p className="text-[var(--text-muted)] text-xs">浏览过的商品将显示在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="bg-[var(--bg-card)] rounded-xl p-3 flex items-center gap-3">
              <button
                onClick={() => nav(`/product/${p.id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <img
                  src={p.imageUrl || `https://placehold.co/56x56/1a1a17/666?text=${encodeURIComponent(p.brand.slice(0, 4))}`}
                  alt="" className="w-10 h-10 rounded-lg object-cover bg-[var(--bg-input)] shrink-0" loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/1a1a17/666?text=${encodeURIComponent(p.brand.slice(0, 2))}` }}
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-sm truncate">{stripBrandPrefix(p.title, p.brand)}</div>
                  <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{p.brand}</div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <div className="text-sm font-bold text-[var(--brand)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(p.currency, p.price)}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{timeAgo(p.viewedAt)}</div>
                </div>
              </button>
              <button
                onClick={() => removeOne(p.id)}
                className="p-1 min-w-[28px] min-h-[28px] rounded text-[var(--text-muted)] hover:text-[var(--danger)] active:text-[var(--danger)] shrink-0 transition-colors"
                aria-label="移除"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2l10 10M12 2l-10 10" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api-client'
import { formatPrice } from '../lib/format'

interface Overview { totalProducts: number; brandCount: number; sourceCount: number; brands: { name: string; count: number; logo: string }[]; lastUpdated: string | null; recentProducts: { id: number; title: string; brand: string; price: string; currency: string; imageUrl: string | null }[] }

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
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mt-4 mb-1">比比喵</h1>
      <p className="text-xs text-[var(--text-secondary)] text-center mb-4">全球商品价格与到手成本查询</p>
      <form onSubmit={search} className="mb-6">
        <input
          className="w-full h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          placeholder="搜索品牌、商品或型号"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </form>

      {overview && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 text-center">
            <div className="bg-[var(--bg-card)] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-[var(--brand)]">{overview.totalProducts}</div>
              <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-0.5">收录商品</div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-[var(--brand)]">{overview.brandCount}</div>
              <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-0.5">品牌</div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-[var(--brand)]">{overview.sourceCount}</div>
              <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-0.5">来源站点</div>
            </div>
          </div>

          {/* Quick start guide */}
          <div className="mb-6 bg-[var(--bg-card)] rounded-xl p-4">
            <h2 className="text-xs font-medium text-[var(--text-primary)] mb-2">快速开始</h2>
            <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              <p className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] flex items-center justify-center shrink-0">1</span> 搜索全球品牌的商品</p>
              <p className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] flex items-center justify-center shrink-0">2</span> 查看各平台实时价格</p>
              <p className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] flex items-center justify-center shrink-0">3</span> 计算含运费+关税的到手成本</p>
            </div>
          </div>

          {overview.recentProducts?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm text-[var(--text-secondary)] mb-3">最近更新</h2>
              <div className="space-y-2">
                {overview.recentProducts.map((p, i) => (
                  <button key={p.id} onClick={() => nav(`/product/${p.id}`)}
                    className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded-xl p-3 flex items-center gap-3 text-left transition-colors min-h-[48px]"
                  >
                    <img
                      src={p.imageUrl || `https://placehold.co/56x56/1a1a17/666?text=${encodeURIComponent(p.brand.slice(0, 4))}`}
                      alt="" className="w-9 h-9 rounded-lg object-cover bg-[var(--bg-card)] shrink-0" loading={i < 3 ? 'eager' : 'lazy'}
                      onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/1a1a17/666?text=${encodeURIComponent(p.brand.slice(0, 2))}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{p.title}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{p.brand}</div>
                    </div>
                    <div className="text-sm font-bold text-[var(--brand)] shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(p.currency, p.price)}</div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)] shrink-0"><path d="M5 3l4 4-4 4"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-sm text-[var(--text-secondary)] mb-3">支持品牌</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {overview.brands.map(b => (
              <button key={b.name} onClick={() => nav(`/search?q=${encodeURIComponent(b.name)}&brand=${encodeURIComponent(b.name)}`)}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-colors min-h-[56px]"
              >
                <img src={b.logo} alt={b.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{b.count} 件</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)] shrink-0"><path d="M5 3l4 4-4 4"/></svg>
              </button>
            ))}
            <button onClick={() => nav('/search')}
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded-xl p-3 sm:p-4 flex items-center justify-center gap-2 text-left transition-colors min-h-[56px] border border-dashed border-[var(--border-subtle)]"
            >
              <span className="text-sm text-[var(--text-secondary)]">更多</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)] shrink-0"><path d="M5 3l4 4-4 4"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

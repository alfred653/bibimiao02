import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api-client'

interface Overview { totalProducts: number; brandCount: number; currencyCount: number; brands: { name: string; count: number; logo: string }[]; lastUpdated: string | null }

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
      <h1 className="text-2xl font-bold text-center my-4">比比喵</h1>
      <form onSubmit={search} className="mb-6">
        <input
          className="w-full h-12 rounded-xl bg-[#1a1a17] border border-white/[0.08] px-4 text-[#f0ede5] placeholder-[#8b8a7e] focus:outline-none focus:border-amber-500/50 transition-colors"
          placeholder="搜索品牌或商品..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </form>

      {overview && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 text-center">
            <div className="bg-white/[0.04] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-amber-500">{overview.totalProducts}</div>
              <div className="text-[10px] sm:text-xs text-[#8b8a7e] mt-0.5">收录商品</div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-amber-500">{overview.brandCount}</div>
              <div className="text-[10px] sm:text-xs text-[#8b8a7e] mt-0.5">品牌</div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-amber-500">{overview.currencyCount}</div>
              <div className="text-[10px] sm:text-xs text-[#8b8a7e] mt-0.5">货币</div>
            </div>
          </div>

          <h2 className="text-sm text-[#8b8a7e] mb-3">支持品牌</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {overview.brands.map(b => (
              <button key={b.name} onClick={() => nav(`/search?q=${encodeURIComponent(b.name)}&brand=${encodeURIComponent(b.name)}`)}
                className="bg-white/[0.04] hover:bg-white/[0.06] active:bg-white/[0.08] rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-colors min-h-[56px]"
              >
                <img src={b.logo} alt={b.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-[#8b8a7e]">{b.count} 件</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

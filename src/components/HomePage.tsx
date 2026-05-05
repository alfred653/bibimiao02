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
          className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          placeholder="搜索品牌或商品..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </form>

      {overview && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-cyan-400">{overview.totalProducts}</div>
              <div className="text-xs text-gray-500">收录商品</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-cyan-400">{overview.brandCount}</div>
              <div className="text-xs text-gray-500">品牌</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-cyan-400">{overview.currencyCount}</div>
              <div className="text-xs text-gray-500">货币</div>
            </div>
          </div>

          <h2 className="text-sm text-gray-400 mb-3">支持品牌</h2>
          <div className="grid grid-cols-2 gap-2">
            {overview.brands.map(b => (
              <button key={b.name} onClick={() => nav(`/search?brand=${encodeURIComponent(b.name)}`)}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 flex items-center gap-3 text-left"
              >
                <img src={b.logo} alt={b.name} className="w-8 h-8 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div>
                  <div className="text-sm">{b.name}</div>
                  <div className="text-xs text-gray-500">{b.count} 件</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

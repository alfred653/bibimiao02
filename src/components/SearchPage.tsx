import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { api, apiPost, apiDelete } from '../lib/api-client'

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text
  const words = keyword.trim().split(/\s+/).filter(Boolean)
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    escaped.some(w => part.toLowerCase() === w.toLowerCase())
      ? <mark key={i} className="bg-amber-500/30 text-amber-300 rounded px-0.5">{part}</mark>
      : part
  )
}

const SORT_OPTIONS = [
  { value: 'relevance:desc', label: '相关度' },
  { value: 'newest:desc', label: '最新' },
  { value: 'price:asc', label: '价格 ↑' },
  { value: 'price:desc', label: '价格 ↓' },
]

export default function SearchPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()

  const [keyword, setKeyword] = useState(params.get('q') || '')
  const [brand, setBrand] = useState(params.get('brand') || '')
  const [source, setSource] = useState('')
  const [currency, setCurrency] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')

  const [results, setResults] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; total: number } | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isAnon, setIsAnon] = useState(false)
  const [searched, setSearched] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [favToggling, setFavToggling] = useState<Set<number>>(new Set())

  const [suggestions, setSuggestions] = useState<{ id: number; title: string; brand: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = keyword.trim()
    if (!q || q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timer = setTimeout(() => {
      fetch(`/api/products/suggest?q=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setSuggestions(d.data)
            setShowSuggestions(true)
          }
        })
        .catch(() => {})
    }, 300)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [keyword])

  function selectSuggestion(item: { id: number; title: string; brand: string }) {
    setKeyword(item.title)
    setShowSuggestions(false)
    doSearch(1, { keyword: item.title })
  }

  const filtersRef = useRef({ keyword, brand, source, currency, sortBy, sortOrder })
  filtersRef.current = { keyword, brand, source, currency, sortBy, sortOrder }

  function doSearch(p = 1, overrides?: Partial<typeof filtersRef.current>) {
    const f = { ...filtersRef.current, ...overrides }
    if (!f.keyword.trim()) return
    setLoading(true)
    setSearched(true)
    const sortByParam = f.sortBy === 'relevance' ? 'relevance' : f.sortBy
    const sortOrderParam = f.sortBy === 'relevance' ? 'desc' : f.sortOrder
    apiPost('/api/products/search', {
        keyword: f.keyword.trim(),
        brand: f.brand || undefined,
        source: f.source || undefined,
        currency: f.currency || undefined,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
        page: p,
        pageSize: 10,
      })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setResults(d.data.items)
          setSummary(d.data.summary)
          setPagination(d.data.pagination)
          setIsAnon(!d.data.items?.[0]?.price)
          setPage(p)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (keyword) doSearch(1)
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    api('/api/favorites').then(r => r.json())
      .then(d => { if (d.success) setFavoriteIds(new Set(d.data.items.map((it: any) => it.id))) })
      .catch(() => {})
  }, [isSignedIn])

  function toggleFavorite(productId: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn) { openLogin(); return }
    setFavToggling(prev => new Set(prev).add(productId))
    const isFav = favoriteIds.has(productId)
    const fetcher = isFav
      ? apiDelete('/api/favorites', { productId })
      : apiPost('/api/favorites', { productId })
    fetcher
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFavoriteIds(prev => {
            const next = new Set(prev)
            isFav ? next.delete(productId) : next.add(productId)
            return next
          })
        }
      })
      .finally(() => setFavToggling(prev => { const n = new Set(prev); n.delete(productId); return n }))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch(1)
  }

  const showFilters = summary || brand

  return (
    <div className="p-4">
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 h-12 rounded-xl bg-[#1a1a17] border border-white/[0.08] px-4 text-[#f0ede5] placeholder-[#8b8a7e] focus:outline-none focus:border-amber-500/50 transition-colors"
          placeholder="搜索品牌或商品..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => doSearch(1)} className="bg-amber-600 px-4 rounded-xl text-sm active:bg-amber-700 transition-colors">搜索</button>
      </div>

      {/* Autocomplete */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="relative -mt-2 mb-3 mx-1">
          <div className="absolute top-0 left-0 right-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg overflow-hidden z-10 shadow-xl">
            {suggestions.map(item => (
              <button
                key={item.id}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                onMouseDown={e => { e.preventDefault(); selectSuggestion(item) }}
              >
                <span className="text-[#f0ede5]">{item.title}</span>
                <span className="text-amber-400 text-xs ml-2">{item.brand}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <select
            value={brand}
            onChange={e => { const v = e.target.value; setBrand(v); doSearch(1, { brand: v }) }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
          >
            <option value="">全部品牌</option>
            {(summary?.brands || (brand ? [brand] : [])).map((b: string) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={e => { const v = e.target.value; setSource(v); doSearch(1, { source: v }) }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
          >
            <option value="">全部来源</option>
            {(summary?.sources || []).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={currency}
            onChange={e => { const v = e.target.value; setCurrency(v); doSearch(1, { currency: v }) }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
          >
            <option value="">全部币种</option>
            {(summary?.currencies || []).map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split(':')
              setSortBy(sb); setSortOrder(so); doSearch(1, { sortBy: sb, sortOrder: so })
            }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden ml-auto shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm min-w-[36px] transition-colors active:scale-95 ${viewMode === 'list' ? 'bg-amber-600 text-white' : 'text-[#8b8a7e] hover:text-[#f0ede5] active:bg-white/[0.06]'}`}
            >☰</button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm min-w-[36px] transition-colors active:scale-95 ${viewMode === 'grid' ? 'bg-amber-600 text-white' : 'text-[#8b8a7e] hover:text-[#f0ede5] active:bg-white/[0.06]'}`}
            >⊞</button>
          </div>
          {(brand || source || currency) && (
            <button
              onClick={() => {
                setBrand(''); setSource(''); setCurrency('')
                doSearch(page, { brand: '', source: '', currency: '' })
              }}
              className="text-xs text-[#8b8a7e] hover:text-red-400 transition-colors px-2 py-1.5 shrink-0"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="text-xs text-[#8b8a7e] mb-4">
          找到 {summary.totalResults} 条 · {summary.brands.length} 品牌 · {summary.sources.length} 站点
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-center text-[#8b8a7e] py-8">搜索中...</div>}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {results.map(item => (
            <div
              key={item.id}
              className="bg-white/[0.04] rounded-xl p-3 cursor-pointer hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
              onClick={() => {
                if (!isSignedIn) { openLogin(); return }
                nav(`/product/${item.id}`)
              }}
            >
              <div className="flex gap-3">
                <img
                  src={item.imageUrl || `https://placehold.co/112x112/1a1a17/d97706?text=${encodeURIComponent((item.brand || '').slice(0, 8))}`}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-white/[0.04] shrink-0"
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.src = `https://placehold.co/112x112/1a1a17/666?text=${encodeURIComponent('N/A')}`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium leading-snug">
                        {highlightText(item.title, keyword)}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-[#8b8a7e]">
                        <span className="bg-amber-500/10 text-amber-400 px-1.5 rounded">{item.brand}</span>
                        {item.source && <span>{item.source}</span>}
                        {item.currency && <span>{item.currency}</span>}
                        {item.spec && <span className="text-[#8b8a7e]">{item.spec}</span>}
                      </div>
                    </div>
                    {item.price && (
                      <div className="text-right shrink-0">
                        <div className="text-amber-500 font-bold">{item.currency || ''} {item.price}</div>
                      </div>
                    )}
                    <button
                      onClick={e => toggleFavorite(item.id, e)}
                      disabled={favToggling.has(item.id)}
                      className={`shrink-0 text-lg p-1.5 min-w-[36px] min-h-[36px] transition-colors active:scale-90 ${favoriteIds.has(item.id) ? 'text-red-400' : 'text-[#8b8a7e] hover:text-red-400'}`}
                      title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                    >
                      {favoriteIds.has(item.id) ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {results.map(item => (
            <div
              key={item.id}
              className="bg-white/[0.04] rounded-xl overflow-hidden cursor-pointer hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
              onClick={() => {
                if (!isSignedIn) { openLogin(); return }
                nav(`/product/${item.id}`)
              }}
            >
              <img
                src={item.imageUrl || `https://placehold.co/400x300/1a1a17/d97706?text=${encodeURIComponent((item.brand || '').slice(0, 12))}`}
                alt=""
                className="w-full aspect-[4/3] object-cover bg-white/[0.04]"
                onError={e => {
                  const el = e.target as HTMLImageElement
                  el.src = `https://placehold.co/400x300/1a1a17/666?text=${encodeURIComponent('N/A')}`
                }}
              />
              <div className="p-2.5">
                <span className="inline-block bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5 rounded mb-1.5">{item.brand}</span>
                <h3 className="text-xs font-medium leading-snug line-clamp-2 mb-1.5 text-[#f0ede5]">
                  {highlightText(item.title, keyword)}
                </h3>
                <div className="flex items-center justify-between">
                  {item.price ? (
                    <span className="text-amber-500 font-bold text-sm">{item.currency || ''} {item.price}</span>
                  ) : (
                    <span className="text-[#8b8a7e] text-xs">登录查看价格</span>
                  )}
                  <div className="flex items-center gap-1">
                    {item.source && <span className="text-[10px] text-[#8b8a7e]">{item.source}</span>}
                    <button
                      onClick={e => toggleFavorite(item.id, e)}
                      disabled={favToggling.has(item.id)}
                      className={`text-base p-1 min-w-[32px] min-h-[32px] transition-colors active:scale-90 ${favoriteIds.has(item.id) ? 'text-red-400' : 'text-[#8b8a7e] hover:text-red-400'}`}
                      title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                    >
                      {favoriteIds.has(item.id) ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!results.length && !loading && searched && (
        <div className="text-center text-[#8b8a7e] py-8">无搜索结果</div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => doSearch(page - 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-[#8b8a7e] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            let pageNum: number
            if (pagination.totalPages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => doSearch(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs ${pageNum === page ? 'bg-amber-600 text-white' : 'bg-white/[0.04] text-[#8b8a7e] hover:bg-white/[0.06]'}`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => doSearch(page + 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-[#8b8a7e] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* Login prompt */}
      {isAnon && (
        <div className="text-center mt-6 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
          <p className="text-sm text-[#8b8a7e] mb-2">登录查看更多结果和实时价格</p>
          <button onClick={openLogin} className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm active:bg-amber-700 transition-colors">登录</button>
        </div>
      )}
    </div>
  )
}

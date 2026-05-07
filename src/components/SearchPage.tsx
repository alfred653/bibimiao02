import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { formatPrice } from '../lib/format'
import { api, apiPost, apiDelete } from '../lib/api-client'

const SUGGESTED_BRANDS = ['Osprey', "Arc'teryx", 'Patagonia', 'The North Face', 'Gregory']

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem('bbm_history') || '[]') } catch { return [] }
}
function saveHistory(items: string[]) {
  localStorage.setItem('bbm_history', JSON.stringify(items.slice(0, 5)))
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text
  const words = keyword.trim().split(/\s+/).filter(Boolean)
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    escaped.some(w => part.toLowerCase() === w.toLowerCase())
      ? <mark key={i} className="bg-[var(--brand)]/30 text-[var(--brand)] rounded px-0.5">{part}</mark>
      : part
  )
}

const SORT_OPTIONS = [
  { value: 'relevance:desc', label: '相关度' },
  { value: 'newest:desc', label: '最新' },
  { value: 'price:asc', label: '价格 ↑' },
  { value: 'price:desc', label: '价格 ↓' },
]

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-lg bg-[var(--bg-card)] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--bg-card)] rounded w-3/4" />
          <div className="flex gap-1.5">
            <div className="h-3 bg-[var(--bg-card)] rounded w-16" />
            <div className="h-3 bg-[var(--bg-card)] rounded w-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PaginationJumper({ current, max, onJump }: { current: number; max: number; onJump: (p: number) => void }) {
  const [input, setInput] = useState(String(current))

  useEffect(() => { setInput(String(current)) }, [current])

  function handleJump() {
    const n = parseInt(input, 10)
    if (n >= 1 && n <= max && n !== current) onJump(n)
    else setInput(String(current))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleJump()
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span>跳至</span>
      <input
        className="w-12 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-center text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand)]"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        inputMode="numeric"
      />
      <button
        onClick={handleJump}
        className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg px-2 py-1 transition-colors"
      >
        跳转
      </button>
      <span className="text-[var(--text-secondary)]/70">/ {max} 页</span>
    </div>
  )
}

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
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

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
  const [searchHistory, setSearchHistory] = useState<string[]>(loadHistory)

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

  function addToHistory(q: string) {
    setSearchHistory(prev => {
      const next = [q, ...prev.filter(x => x !== q)].slice(0, 5)
      saveHistory(next)
      return next
    })
  }

  function removeHistoryItem(index: number) {
    setSearchHistory(prev => {
      const next = prev.filter((_, i) => i !== index)
      saveHistory(next)
      return next
    })
  }

  function clearHistory() {
    setSearchHistory([])
    saveHistory([])
  }

  const filtersRef = useRef({ keyword, brand, source, currency, sortBy, sortOrder, priceMin, priceMax })
  filtersRef.current = { keyword, brand, source, currency, sortBy, sortOrder, priceMin, priceMax }

  function doSearch(p = 1, overrides?: Partial<typeof filtersRef.current>) {
    const f = { ...filtersRef.current, ...overrides }
    if (!f.keyword.trim()) return
    setLoading(true)
    setSearched(true)
    addToHistory(f.keyword.trim())
    const sortByParam = f.sortBy === 'relevance' ? 'relevance' : f.sortBy
    const sortOrderParam = f.sortBy === 'relevance' ? 'desc' : f.sortOrder
    apiPost('/api/products/search', {
        keyword: f.keyword.trim(),
        brand: f.brand || undefined,
        source: f.source || undefined,
        currency: f.currency || undefined,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
        priceMin: f.priceMin || undefined,
        priceMax: f.priceMax || undefined,
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
  const showHistory = !keyword.trim() && !searched && searchHistory.length > 0

  return (
    <div className="p-4">
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          placeholder="搜索品牌、商品或型号"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => doSearch(1)} className="bg-[var(--brand)] px-4 rounded-xl text-sm active:bg-[var(--brand-hover)] transition-colors">搜索</button>
      </div>

      {/* Search history */}
      {showHistory && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-secondary)]">最近搜索</span>
            <button onClick={clearHistory} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">清除全部</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {searchHistory.map((q, i) => (
              <span key={i} className="inline-flex items-center bg-[var(--bg-card)] rounded-lg overflow-hidden">
                <button
                  onClick={() => { setKeyword(q); doSearch(1, { keyword: q }) }}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                >
                  {q}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); removeHistoryItem(i) }}
                  className="px-1.5 py-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  aria-label={`删除 ${q}`}
                >×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Initial recommendations */}
      {!keyword.trim() && !searched && searchHistory.length === 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-[var(--text-secondary)] mb-2">热门品牌</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_BRANDS.map(b => (
              <button
                key={b}
                onClick={() => { setKeyword(b); doSearch(1, { keyword: b }) }}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors"
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Autocomplete */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="relative -mt-2 mb-3 mx-1">
          <div className="absolute top-0 left-0 right-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden z-10 shadow-xl">
            {suggestions.map(item => (
              <button
                key={item.id}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-0"
                onMouseDown={e => { e.preventDefault(); selectSuggestion(item) }}
              >
                <span className="text-[var(--text-primary)]">{item.title}</span>
                <span className="text-[var(--brand)] text-xs ml-2">{item.brand}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {(brand || source || currency || priceMin || priceMax) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {brand && (
            <button
              onClick={() => { setBrand(''); doSearch(1, { brand: '' }) }}
              className="inline-flex items-center gap-1 bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-1 rounded-full hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors"
            >
              {brand} <span className="text-[10px]">×</span>
            </button>
          )}
          {source && (
            <button
              onClick={() => { setSource(''); doSearch(1, { source: '' }) }}
              className="inline-flex items-center gap-1 bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-1 rounded-full hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors"
            >
              {source} <span className="text-[10px]">×</span>
            </button>
          )}
          {currency && (
            <button
              onClick={() => { setCurrency(''); doSearch(1, { currency: '' }) }}
              className="inline-flex items-center gap-1 bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-1 rounded-full hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors"
            >
              {currency} <span className="text-[10px]">×</span>
            </button>
          )}
          {priceMin && (
            <button
              onClick={() => { setPriceMin(''); doSearch(1, { priceMin: '' }) }}
              className="inline-flex items-center gap-1 bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-1 rounded-full hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors"
            >
              ≥{priceMin} <span className="text-[10px]">×</span>
            </button>
          )}
          {priceMax && (
            <button
              onClick={() => { setPriceMax(''); doSearch(1, { priceMax: '' }) }}
              className="inline-flex items-center gap-1 bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-1 rounded-full hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors"
            >
              ≤{priceMax} <span className="text-[10px]">×</span>
            </button>
          )}
          <button
            onClick={() => { setBrand(''); setSource(''); setCurrency(''); setPriceMin(''); setPriceMax(''); doSearch(page, { brand: '', source: '', currency: '', priceMin: '', priceMax: '' }) }}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors ml-1"
          >
            清除全部
          </button>
        </div>
      )}

      {/* Filters + Sort */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <select value={brand} onChange={e => { const v = e.target.value; setBrand(v); doSearch(1, { brand: v }) }} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]">
            <option value="">全部品牌</option>
            {(summary?.brands || (brand ? [brand] : [])).map((b: string) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select value={source} onChange={e => { const v = e.target.value; setSource(v); doSearch(1, { source: v }) }} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]">
            <option value="">全部来源</option>
            {(summary?.sources || []).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={currency} onChange={e => { const v = e.target.value; setCurrency(v); doSearch(1, { currency: v }) }} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]">
            <option value="">全部币种</option>
            {(summary?.currencies || []).map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="最低价"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            onBlur={() => doSearch(1)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(1) }}
            className="w-16 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)]"
          />
          <input
            type="number"
            placeholder="最高价"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            onBlur={() => doSearch(1)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(1) }}
            className="w-16 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)]"
          />
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [sb, so] = e.target.value.split(':'); setSortBy(sb); setSortOrder(so); doSearch(1, { sortBy: sb, sortOrder: so }) }} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]">
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden ml-auto shrink-0">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm min-w-[36px] transition-colors active:scale-95 ${viewMode === 'list' ? 'bg-[var(--brand)] text-[var(--button-on-brand)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-[var(--bg-hover)]'}`}>☰</button>
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm min-w-[36px] transition-colors active:scale-95 ${viewMode === 'grid' ? 'bg-[var(--brand)] text-[var(--button-on-brand)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-[var(--bg-hover)]'}`}>⊞</button>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="text-xs text-[var(--text-secondary)] mb-4">
          找到 {summary.totalResults} 件商品 · {summary.brands.length} 品牌 · {summary.sources.length} 站点
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!results.length && !loading && searched && (
        <div className="text-center py-10">
          <p className="text-[var(--text-secondary)] mb-2">没有找到匹配的商品</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">试试搜索品牌名、英文型号或容量，例如：</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTED_BRANDS.map(b => (
              <button
                key={b}
                onClick={() => { setKeyword(b); doSearch(1, { keyword: b }) }}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] rounded-lg px-3 py-1.5 text-xs text-[var(--brand)] transition-colors"
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && !loading && (
        <div className="space-y-3">
          <AnimatePresence>
            {results.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="bg-[var(--bg-card)] rounded-xl p-3 cursor-pointer hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                onClick={() => {
                  if (!isSignedIn) { openLogin(); return }
                  nav(`/product/${item.id}`)
                }}
              >
                <div className="flex gap-3">
                  <img
                    src={item.imageUrl || `https://placehold.co/112x112/1a1a17/d97757?text=${encodeURIComponent((item.brand || '').slice(0, 8))}`}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 rounded-lg object-cover bg-[var(--bg-card)] shrink-0"
                    onError={e => {
                      const el = e.target as HTMLImageElement
                      el.src = `https://placehold.co/112x112/1a1a17/666?text=${encodeURIComponent('暂无图片')}`
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium leading-snug">
                          {highlightText(item.title, keyword)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-xs">
                          <span className="bg-[var(--brand)]/10 text-[var(--brand)] font-medium px-1.5 py-0.5 rounded">{item.brand}</span>
                          {item.source && <span className="text-[var(--text-secondary)]">{item.source}</span>}
                          {item.spec && <span className="text-[var(--text-muted)] text-[11px]">{item.spec}</span>}
                          {item.currency && <span className="text-[var(--text-muted)] text-[11px]">{item.currency}</span>}
                        </div>
                      </div>
                      {item.price && (
                        <div className="text-right shrink-0">
                          <div className="text-[var(--brand)] font-bold text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(item.currency, item.price)}</div>
                        </div>
                      )}
                      <button
                        onClick={e => toggleFavorite(item.id, e)}
                        disabled={favToggling.has(item.id)}
                        className={`shrink-0 text-xl p-1.5 min-w-[40px] min-h-[40px] rounded-lg transition-all active:scale-90 ${favoriteIds.has(item.id) ? 'text-[var(--danger)] bg-[var(--danger)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/5'}`}
                        title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                      >
                        {favoriteIds.has(item.id) ? '♥' : '♡'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {results.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="bg-[var(--bg-card)] rounded-xl overflow-hidden cursor-pointer hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                onClick={() => {
                  if (!isSignedIn) { openLogin(); return }
                  nav(`/product/${item.id}`)
                }}
              >
                <img
                  src={item.imageUrl || `https://placehold.co/400x300/1a1a17/d97757?text=${encodeURIComponent((item.brand || '').slice(0, 12))}`}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover bg-[var(--bg-card)]"
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.src = `https://placehold.co/400x300/1a1a17/666?text=${encodeURIComponent('暂无图片')}`
                  }}
                />
                <div className="p-2.5">
                  <span className="inline-block bg-[var(--brand)]/10 text-[var(--brand)] text-[10px] px-1.5 py-0.5 rounded mb-1.5">{item.brand}</span>
                  <h3 className="text-xs font-medium leading-snug line-clamp-2 mb-1.5 text-[var(--text-primary)]">
                    {highlightText(item.title, keyword)}
                  </h3>
                  <div className="flex items-center justify-between">
                    {item.price ? (
                      <span className="text-[var(--brand)] font-bold text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(item.currency, item.price)}</span>
                    ) : (
                      <span className="text-[var(--text-secondary)] text-xs">登录查看价格</span>
                    )}
                    <div className="flex items-center gap-1">
                      {item.source && <span className="text-[10px] text-[var(--text-secondary)]">{item.source}</span>}
                      <button
                        onClick={e => toggleFavorite(item.id, e)}
                        disabled={favToggling.has(item.id)}
                        className={`text-lg p-1.5 min-w-[36px] min-h-[36px] rounded-lg transition-all active:scale-90 ${favoriteIds.has(item.id) ? 'text-[var(--danger)] bg-[var(--danger)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/5'}`}
                        title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                      >
                        {favoriteIds.has(item.id) ? '♥' : '♡'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button disabled={page <= 1} onClick={() => doSearch(page - 1)} className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">上一页</button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) { pageNum = i + 1 }
              else if (page <= 3) { pageNum = i + 1 }
              else if (page >= pagination.totalPages - 2) { pageNum = pagination.totalPages - 4 + i }
              else { pageNum = page - 2 + i }
              return (
                <button key={pageNum} onClick={() => doSearch(pageNum)} className={`w-8 h-8 rounded-lg text-xs transition-colors ${pageNum === page ? 'bg-[var(--brand)] text-[var(--button-on-brand)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>{pageNum}</button>
              )
            })}
            <button disabled={page >= pagination.totalPages} onClick={() => doSearch(page + 1)} className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">下一页</button>
          </div>
          <PaginationJumper
            current={page}
            max={pagination.totalPages}
            onJump={p => doSearch(p)}
          />
        </div>
      )}

      {/* Login prompt */}
      {isAnon && (
        <div className="text-center mt-6 p-4 bg-[var(--brand)]/5 rounded-xl border border-[var(--brand-soft)]">
          <p className="text-sm text-[var(--text-secondary)] mb-2">登录查看更多结果和实时价格</p>
          <button onClick={openLogin} className="bg-[var(--brand)] text-[var(--button-on-brand)] px-6 py-2 rounded-lg text-sm active:bg-[var(--brand-hover)] transition-colors">登录</button>
        </div>
      )}
    </div>
  )
}

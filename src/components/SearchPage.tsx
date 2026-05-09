import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useNavigationType } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { formatPrice, stripBrandPrefix } from '../lib/format'
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
      ? <mark key={i} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', padding: '0 2px' }}>{part}</mark>
      : part
  )
}

const SORT_OPTIONS = [
  { value: 'relevance:desc', label: 'SORT: REL.' },
  { value: 'newest:desc', label: 'SORT: NEW' },
  { value: 'price:asc', label: 'SORT: PRICE ↑' },
  { value: 'price:desc', label: 'SORT: PRICE ↓' },
]

function PaginationJumper({ current, max, onJump }: { current: number; max: number; onJump: (p: number) => void }) {
  const [input, setInput] = useState(String(current))
  useEffect(() => { setInput(String(current)) }, [current])
  function handleJump() {
    const n = parseInt(input, 10)
    if (n >= 1 && n <= max && n !== current) onJump(n)
    else setInput(String(current))
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      <span>GO TO</span>
      <input
        style={{ width: '48px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', outline: 'none' }}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleJump() }}
        inputMode="numeric"
      />
      <button
        onClick={handleJump}
        style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', cursor: 'pointer', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)' }}
      >GO</button>
      <span style={{ opacity: 0.7 }}>/ {max}</span>
    </div>
  )
}

export default function SearchPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const navigationType = useNavigationType()
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
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [favToggling, setFavToggling] = useState<Set<number>>(new Set())
  const [searchHistory, setSearchHistory] = useState<string[]>(loadHistory)

  const [suggestions, setSuggestions] = useState<{ id: number; title: string; brand: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = keyword.trim()
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timer = setTimeout(() => {
      fetch(`/api/products/suggest?q=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(d => { if (d.success) { setSuggestions(d.data); setShowSuggestions(true) } })
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
    setSearchHistory(prev => { const next = [q, ...prev.filter(x => x !== q)].slice(0, 5); saveHistory(next); return next })
  }
  function removeHistoryItem(index: number) {
    setSearchHistory(prev => { const next = prev.filter((_, i) => i !== index); saveHistory(next); return next })
  }
  function clearHistory() { setSearchHistory([]); saveHistory([]) }

  const filtersRef = useRef({ keyword, brand, source, currency, sortBy, sortOrder, priceMin, priceMax })
  filtersRef.current = { keyword, brand, source, currency, sortBy, sortOrder, priceMin, priceMax }

  function doSearch(p = 1, overrides?: Partial<typeof filtersRef.current>) {
    const f = { ...filtersRef.current, ...overrides }
    if (!f.keyword.trim()) return
    setLoading(true); setSearched(true); addToHistory(f.keyword.trim())
    apiPost('/api/products/search', {
      keyword: f.keyword.trim(), brand: f.brand || undefined, source: f.source || undefined,
      currency: f.currency || undefined, sortBy: f.sortBy === 'relevance' ? 'relevance' : f.sortBy,
      sortOrder: f.sortBy === 'relevance' ? 'desc' : f.sortOrder,
      priceMin: f.priceMin || undefined, priceMax: f.priceMax || undefined, page: p, pageSize: 10,
    }).then(r => r.json()).then(d => {
      if (d.success) {
        setResults(d.data.items); setSummary(d.data.summary); setPagination(d.data.pagination)
        setIsAnon(!isSignedIn); setPage(p)
        sessionStorage.setItem('bbm_last_search', JSON.stringify({
          keyword: f.keyword.trim(), brand: f.brand, source: f.source, currency: f.currency,
          sortBy: f.sortBy, sortOrder: f.sortOrder, priceMin: f.priceMin, priceMax: f.priceMax,
        }))
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem('bbm_last_search')
      if (saved) {
        try {
          const s = JSON.parse(saved)
          if (s.keyword) {
            setKeyword(s.keyword); if (s.brand) setBrand(s.brand); if (s.source) setSource(s.source)
            if (s.currency) setCurrency(s.currency); if (s.sortBy) setSortBy(s.sortBy)
            if (s.sortOrder) setSortOrder(s.sortOrder); if (s.priceMin) setPriceMin(s.priceMin)
            if (s.priceMax) setPriceMax(s.priceMax)
            doSearch(1, { keyword: s.keyword, brand: s.brand, source: s.source, currency: s.currency, sortBy: s.sortBy, sortOrder: s.sortOrder, priceMin: s.priceMin, priceMax: s.priceMax })
          }
        } catch {}
      }
    } else { sessionStorage.removeItem('bbm_last_search') }
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    api('/api/favorites?idsOnly=1').then(r => r.json()).then(d => { if (d.success) setFavoriteIds(new Set(d.data.ids)) }).catch(() => {})
  }, [isSignedIn])

  function toggleFavorite(productId: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn) { openLogin(); return }
    setFavToggling(prev => new Set(prev).add(productId))
    const isFav = favoriteIds.has(productId)
    const fetcher = isFav ? apiDelete('/api/favorites', { productId }) : apiPost('/api/favorites', { productId })
    fetcher.then(r => r.json()).then(d => {
      if (d.success) {
        setFavoriteIds(prev => { const next = new Set(prev); isFav ? next.delete(productId) : next.add(productId); return next })
      }
    }).finally(() => setFavToggling(prev => { const n = new Set(prev); n.delete(productId); return n }))
  }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter') doSearch(1) }
  const showFilters = summary || brand
  const showHistory = !keyword.trim() && !searched && searchHistory.length > 0

  const rowStyle: React.CSSProperties = {
    height: 'var(--row-height)',
    display: 'grid',
    gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto 24px',
    borderBottom: 'var(--border-width) solid var(--border-default)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      {/* Header bar */}
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '9px', fontWeight: 800 }}>02</span>
      </header>

      {/* Title + search */}
      <section style={{
        padding: '14px var(--page-padding) 10px',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', maxWidth: '260px' }}>
          Product<br />Search
        </h1>
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px', display: 'block' }}>Enter Brand Keyword</span>
          <input
            style={{ width: '100%', marginTop: '4px', border: '0', padding: '0', background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px', fontWeight: 500, textTransform: 'uppercase', outline: 'none' }}
            placeholder="TYPE KEYWORD_"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </label>
      </section>

      {/* History / suggestions */}
      {showHistory && (
        <div style={{ padding: '8px var(--page-padding)', borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Recent</span>
            <button onClick={clearHistory} style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Clear All</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {searchHistory.map((q, i) => (
              <span key={i} style={{ display: 'inline-flex', border: 'var(--border-width) solid var(--border-default)' }}>
                <button onClick={() => { setKeyword(q); doSearch(1, { keyword: q }) }} style={{ background: 'var(--bg-primary)', border: 'none', padding: '4px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>{q}</button>
                <button onClick={e => { e.stopPropagation(); removeHistoryItem(i) }} style={{ background: 'var(--bg-primary)', border: 'none', borderLeft: 'var(--border-width) solid var(--border-default)', padding: '4px 6px', fontSize: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {!keyword.trim() && !searched && searchHistory.length === 0 && (
        <div style={{ padding: '8px var(--page-padding)', borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
          <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Popular Brands</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {SUGGESTED_BRANDS.map(b => (
              <button key={b} onClick={() => { setKeyword(b); doSearch(1, { keyword: b }) }} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>{b}</button>
            ))}
          </div>
        </div>
      )}

      {/* Autocomplete */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
          {suggestions.map(item => (
            <button key={item.id} onMouseDown={e => { e.preventDefault(); selectSuggestion(item) }}
              style={{ width: '100%', textAlign: 'left', padding: '8px var(--page-padding)', background: 'var(--bg-primary)', border: 'none', borderBottom: 'var(--border-width) solid var(--border-default)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}
            >
              {item.title} <span style={{ color: 'var(--brand)', marginLeft: '8px' }}>{item.brand}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active filter pills */}
      {(brand || source || currency || priceMin || priceMax) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 0' }}>
          {brand && <button onClick={() => { setBrand(''); doSearch(1, { brand: '' }) }} style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--brand)', padding: '3px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--brand)' }}>{brand} ×</button>}
          {source && <button onClick={() => { setSource(''); doSearch(1, { source: '' }) }} style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--brand)', padding: '3px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--brand)' }}>{source} ×</button>}
          {currency && <button onClick={() => { setCurrency(''); doSearch(1, { currency: '' }) }} style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--brand)', padding: '3px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--brand)' }}>{currency} ×</button>}
          {priceMin && <button onClick={() => { setPriceMin(''); doSearch(1, { priceMin: '' }) }} style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--brand)', padding: '3px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--brand)' }}>≥{priceMin} ×</button>}
          {priceMax && <button onClick={() => { setPriceMax(''); doSearch(1, { priceMax: '' }) }} style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--brand)', padding: '3px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--brand)' }}>≤{priceMax} ×</button>}
          <button onClick={() => { setBrand(''); setSource(''); setCurrency(''); setPriceMin(''); setPriceMax(''); doSearch(page, { brand: '', source: '', currency: '', priceMin: '', priceMax: '' }) }}
            style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '4px' }}>Clear All</button>
        </div>
      )}

      {/* Filters + sort */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '4px', padding: '8px 0', overflowX: 'auto', flexWrap: 'wrap' }}>
          <select value={brand} onChange={e => { const v = e.target.value; setBrand(v); doSearch(1, { brand: v }) }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="">ALL BRANDS</option>
            {(summary?.brands || (brand ? [brand] : [])).map((b: string) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={source} onChange={e => { const v = e.target.value; setSource(v); doSearch(1, { source: v }) }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="">ALL SOURCES</option>
            {(summary?.sources || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={currency} onChange={e => { const v = e.target.value; setCurrency(v); doSearch(1, { currency: v }) }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="">ALL CURR.</option>
            {(summary?.currencies || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="MIN" value={priceMin} onChange={e => setPriceMin(e.target.value)} onBlur={() => doSearch(1)} onKeyDown={e => { if (e.key === 'Enter') doSearch(1) }}
            style={{ width: '56px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, color: 'var(--text-primary)', outline: 'none' }} />
          <input type="number" placeholder="MAX" value={priceMax} onChange={e => setPriceMax(e.target.value)} onBlur={() => doSearch(1)} onKeyDown={e => { if (e.key === 'Enter') doSearch(1) }}
            style={{ width: '56px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, color: 'var(--text-primary)', outline: 'none' }} />
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [sb, so] = e.target.value.split(':'); setSortBy(sb); setSortOrder(so); doSearch(1, { sortBy: sb, sortOrder: so }) }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none' }}>
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      )}

      {/* Count bar */}
      {summary && (
        <div style={{ height: '36px', padding: '0 var(--page-padding)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
          <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Results Found ({summary.totalResults})
          </span>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...rowStyle, cursor: 'default' }}>
              <div style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', background: 'var(--bg-secondary)' }} />
              <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ height: '13px', background: 'var(--bg-secondary)', width: '75%' }} />
                <div style={{ height: '9px', background: 'var(--bg-secondary)', width: '40%' }} />
              </div>
              <div />
              <div />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!results.length && !loading && searched && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>No Results Found</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {SUGGESTED_BRANDS.map(b => (
              <button key={b} onClick={() => { setKeyword(b); doSearch(1, { keyword: b }) }} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>{b}</button>
            ))}
          </div>
        </div>
      )}

      {/* Product list */}
      {!loading && (
        <AnimatePresence>
          {results.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              onClick={() => { if (!isSignedIn) { openLogin(); return }; nav(`/product/${item.id}`) }}
              style={rowStyle}
            >
              <img
                src={item.imageUrl || `https://placehold.co/72x92/B8B8AD/5C5D55?text=${encodeURIComponent((item.brand || '').slice(0, 4))}`}
                alt="" loading="lazy"
                style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover', border: 'var(--border-width) solid var(--border-default)' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x92/B8B8AD/5C5D55?text=N/A' }}
              />
              <div style={{ minWidth: 0, padding: '12px 6px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 style={{
                  margin: 0, fontFamily: 'var(--font-display)', fontSize: '12px', lineHeight: '13px',
                  fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {highlightText(stripBrandPrefix(item.title, item.brand), keyword)}
                </h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.brand}</span>
                  {item.source && <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{item.source}</span>}
                </div>
              </div>
              <div style={{ alignSelf: 'end', padding: '0 6px 10px 0', fontSize: '15px', lineHeight: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {item.price ? formatPrice(item.currency, item.price) : '—'}
              </div>
              <button
                onClick={e => toggleFavorite(item.id, e)}
                disabled={favToggling.has(item.id)}
                style={{
                  width: '18px', height: '18px', marginTop: '10px', marginRight: '6px',
                  border: favoriteIds.has(item.id) ? '1px solid currentColor' : '1px solid currentColor',
                  borderRadius: '50%', display: 'grid', placeItems: 'center',
                  fontSize: '8px', lineHeight: '1', fontWeight: 800, cursor: 'pointer',
                  background: 'transparent', color: favoriteIds.has(item.id) ? 'var(--danger)' : 'inherit',
                  padding: 0,
                }}
                aria-label={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
              >
                {favoriteIds.has(item.id) ? '♥' : '♡'}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button disabled={page <= 1} onClick={() => doSearch(page - 1)}
              style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 12px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)', opacity: page <= 1 ? 0.3 : 1 }}>PREV</button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) pageNum = i + 1
              else if (page <= 3) pageNum = i + 1
              else if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
              else pageNum = page - 2 + i
              return (
                <button key={pageNum} onClick={() => doSearch(pageNum)}
                  style={{
                    width: '32px', height: '32px', fontSize: '11px', fontWeight: 900,
                    cursor: 'pointer', border: 'var(--border-width) solid var(--border-default)',
                    background: pageNum === page ? 'var(--bg-active)' : 'var(--bg-primary)',
                    color: pageNum === page ? 'var(--text-inverse)' : 'var(--text-primary)',
                  }}>{pageNum}</button>
              )
            })}
            <button disabled={page >= pagination.totalPages} onClick={() => doSearch(page + 1)}
              style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 12px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)', opacity: page >= pagination.totalPages ? 0.3 : 1 }}>NEXT</button>
          </div>
          <PaginationJumper current={page} max={pagination.totalPages} onJump={p => doSearch(p)} />
        </div>
      )}

      {/* Login prompt */}
      {isAnon && (
        <div style={{ textAlign: 'center', padding: '16px', border: 'var(--border-width) solid var(--border-default)', marginTop: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Login to see full results</p>
          <button onClick={openLogin} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '8px 24px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Login</button>
        </div>
      )}
    </div>
  )
}

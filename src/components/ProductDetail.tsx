import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiPost, apiDelete } from '../lib/api-client'
import { formatPrice, getPlaceholderUrl } from '../lib/format'

interface Carrier {
  id: number; name: string; firstWeight: number; firstCost: number;
  additionalWeight: number; additionalCost: number; volumeDivisor: number; isActive: string;
}

const TARGET_CURRENCIES = ['CNY', 'USD', 'JPY', 'EUR', 'GBP', 'HKD']

function saveRecentView(p: { id: number; title: string; brand: string; price: string; currency: string; imageUrl: string | null }) {
  try {
    const stored = JSON.parse(localStorage.getItem('bbm_recent_views') || '[]')
    const filtered = stored.filter((item: any) => item.id !== p.id)
    const entry = { id: p.id, title: p.title, brand: p.brand, price: p.price, currency: p.currency, imageUrl: p.imageUrl, viewedAt: Date.now() }
    localStorage.setItem('bbm_recent_views', JSON.stringify([entry, ...filtered].slice(0, 20)))
  } catch {}
}

interface EstimateResult {
  convertedPriceFormatted: string
  exchangeRate: { rate: number; source: string }
  shippingEstimate?: { cost: number; label: string }
  extraCost: number
  estimatedCostFormatted: string
  profitTrial?: { suggestedQuotePrice: string; estimatedProfit: string; estimatedMarginRate: string; status: string }
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
  padding: '8px 10px', fontSize: '13px', fontFamily: 'var(--font-body)',
  color: 'var(--text-primary)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)',
}

const sectionStyle: React.CSSProperties = {
  borderBottom: 'var(--border-width) solid var(--border-default)',
  padding: '12px var(--page-padding)',
  marginLeft: 'calc(-1 * var(--page-padding))',
  marginRight: 'calc(-1 * var(--page-padding))',
}

const sectionHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px var(--page-padding)',
  marginLeft: 'calc(-1 * var(--page-padding))',
  marginRight: 'calc(-1 * var(--page-padding))',
  borderBottom: 'var(--border-width) solid var(--border-default)',
  background: 'var(--bg-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--fs-label)',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()
  const { toast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [favToggling, setFavToggling] = useState(false)

  const [firstWeight, setFirstWeight] = useState('0.5')
  const [firstCost, setFirstCost] = useState('32')
  const [additionalWeight, setAdditionalWeight] = useState('0.5')
  const [additionalCost, setAdditionalCost] = useState('10')
  const [volumeDivisor, setVolumeDivisor] = useState('6000')
  const [weight, setWeight] = useState('1.5')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [extraCost, setExtraCost] = useState('0')
  const [marginRate, setMarginRate] = useState('30')
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [estimateError, setEstimateError] = useState('')
  const [sourceCopied, setSourceCopied] = useState(false)
  const [crossSource, setCrossSource] = useState<any[] | null>(null)
  const [showInfo, setShowInfo] = useState(true)
  const [showCalculator, setShowCalculator] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null)
  const [showShippingHelp, setShowShippingHelp] = useState(false)

  useEffect(() => {
    api('/api/shipping-carriers').then(r => r.json()).then(d => {
      if (d.success) {
        setCarriers(d.data)
        try {
          const defs = JSON.parse(localStorage.getItem('bbm_default_shipping') || '{}')
          if (defs.weight !== undefined) setWeight(defs.weight)
          if (defs.length !== undefined) setLength(defs.length)
          if (defs.width !== undefined) setWidth(defs.width)
          if (defs.height !== undefined) setHeight(defs.height)
          if (defs.extraCost !== undefined) setExtraCost(defs.extraCost)
          if (defs.marginRate !== undefined) setMarginRate(defs.marginRate)
          if (defs.carrierId) {
            setSelectedCarrierId(defs.carrierId)
            const c = d.data.find((x: Carrier) => x.id === defs.carrierId)
            if (c) {
              setFirstWeight(String(c.firstWeight)); setFirstCost(String(c.firstCost))
              setAdditionalWeight(String(c.additionalWeight)); setAdditionalCost(String(c.additionalCost))
              setVolumeDivisor(String(c.volumeDivisor))
            }
          }
        } catch {}
      }
    }).catch((e) => console.warn('Failed to load carriers:', e))
  }, [])

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
      if (d.success) {
        setProduct(d.data); setFavorited(d.data.favorited); saveRecentView(d.data)
        const titleWords = (d.data.title || '').split(/\s+/).slice(0, 3).join(' ')
        if (titleWords) {
          apiPost('/api/products/search', { keyword: titleWords, pageSize: 10 })
            .then(r => r.json()).then(sd => {
              if (sd.success) setCrossSource(sd.data.items.filter((i: any) => i.id !== d.data.id && i.source !== d.data.source))
            }).catch(() => {})
        }
      }
    }).finally(() => setLoading(false))
  }, [id])

  const [displayCurrency, setDisplayCurrency] = useState('')
  const [dispRate, setDispRate] = useState<{ rate: number; source: string; updatedAt: string } | null>(null)
  const [dispConverted, setDispConverted] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)

  useEffect(() => {
    if (!product) return
    try {
      const settings = JSON.parse(localStorage.getItem('bbm_exchange_settings') || '{}')
      setDisplayCurrency(settings.preferredCurrency || product.currency || 'CNY')
    } catch { setDisplayCurrency(product.currency || 'CNY') }
  }, [product])

  useEffect(() => {
    if (!product || !displayCurrency || displayCurrency === (product.currency || 'CNY')) {
      setDispRate(null); setDispConverted(null); return
    }
    setRateLoading(true)
    api(`/api/exchange-rate?from=${encodeURIComponent(product.currency || 'CNY')}&to=${encodeURIComponent(displayCurrency)}`)
      .then(r => r.json()).then(d => {
        if (d.success) { setDispRate({ rate: d.data.rate, source: d.data.source, updatedAt: d.data.updatedAt }); setDispConverted(Math.round((parseFloat(product.price) || 0) * d.data.rate * 100) / 100) }
      }).catch(() => { setDispRate(null); setDispConverted(null) })
      .finally(() => setRateLoading(false))
  }, [displayCurrency, product])

  function calcEstimate() {
    if (!product) return
    setEstimating(true); setEstimateError('')
    apiPost('/api/cost-estimate', {
      price: product.price, currency: product.currency || 'CNY', targetCurrency: 'CNY',
      shipping: {
        mode: 'custom', firstWeight: parseFloat(firstWeight) || 0, firstCost: parseFloat(firstCost) || 0,
        additionalWeight: parseFloat(additionalWeight) || 0, additionalCost: parseFloat(additionalCost) || 0,
        volumeDivisor: parseFloat(volumeDivisor) || 6000, weight: parseFloat(weight) || 0,
        length: parseFloat(length) || 0, width: parseFloat(width) || 0, height: parseFloat(height) || 0,
      },
      extraCost: parseFloat(extraCost) || 0, targetMarginRate: parseFloat(marginRate) || undefined,
    }).then(r => r.json()).then(d => {
      if (d.success) setEstimate(d.data); else setEstimateError(d.error?.message || 'Calculation failed')
    }).catch((e: Error) => setEstimateError(e.message || 'Network error'))
    .finally(() => setEstimating(false))
  }

  function toggleFavorite() {
    if (!product) return; setFavToggling(true)
    const fetcher = favorited ? apiDelete('/api/favorites', { productId: product.id }) : apiPost('/api/favorites', { productId: product.id })
    fetcher.then(r => r.json()).then(d => { if (d.success) setFavorited(!favorited) }).finally(() => setFavToggling(false))
  }

  function shareResult() {
    if (!estimate || !product) return
    const lines = [`${product.title}`, `Price: ${product.currency} ${product.price}`, `Rate: 1 ${product.currency} = ${estimate.exchangeRate.rate} CNY`, `Converted: ${estimate.convertedPriceFormatted}`]
    if (estimate.shippingEstimate) lines.push(`Shipping: ${estimate.shippingEstimate.cost} (${estimate.shippingEstimate.label})`)
    lines.push(`Extra: ${estimate.extraCost}`, `Total Cost: ${estimate.estimatedCostFormatted}`)
    if (estimate.profitTrial) { lines.push(`Suggested Price: ${estimate.profitTrial.suggestedQuotePrice}`, `Profit: ${estimate.profitTrial.estimatedProfit}`, `Margin: ${estimate.profitTrial.estimatedMarginRate}`) }
    const text = lines.join('\n')
    if (navigator.share) {
      navigator.share({ title: product.title, text }).catch(() => { navigator.clipboard.writeText(text).then(() => toast('Copied', 'success')).catch(() => {}) })
    } else { navigator.clipboard.writeText(text).then(() => toast('Copied', 'success')).catch(() => {}) }
  }

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading...</div>
  if (!product) return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Product Not Found</p>
      <button onClick={() => nav('/search')} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '8px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Go to Search</button>
    </div>
  )

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <button onClick={() => (window.history.length > 1 ? nav(-1) : nav('/search'))} style={{ background: 'none', border: 'none', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>
          ← BACK
        </button>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '13px', fontWeight: 800 }}>03</span>
      </header>

      {/* Product image */}
      <div style={{ ...sectionStyle, padding: '0', display: 'flex', justifyContent: 'center' }}>
        <img
          src={product.imageUrl || getPlaceholderUrl(product.brand || '?', 800, 400)}
          alt="" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }}
          loading="eager"
          onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 800, 400) }}
        />
      </div>

      {/* Product title */}
      <div style={sectionStyle}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 5vw, 22px)', lineHeight: '1', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
          {product.title}
        </h1>
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>{product.brand}</span>
          <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>{product.source}</span>
        </div>
      </div>

      {/* Price & Exchange */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>Price</div>
            <div style={{ fontSize: '28px', lineHeight: '1', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(product.currency, product.price)}
            </div>
            {product.originalPrice && (
              <div style={{ fontSize: '13px', textDecoration: 'line-through', opacity: 0.5, marginTop: '2px' }}>
                {formatPrice(product.currency, product.originalPrice)}
              </div>
            )}
          </div>
          <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 10px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', outline: 'none' }}>
            {TARGET_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {rateLoading && <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Fetching rate...</div>}
        {dispRate && dispConverted !== null && !rateLoading && (
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', border: 'var(--border-width) solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
              <span>Converted</span>
              <span style={{ color: 'var(--success)' }}>{formatPrice(displayCurrency, dispConverted)}</span>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              1 {product.currency} = {dispRate.rate} {displayCurrency} · {dispRate.source}
            </div>
          </div>
        )}
      </div>

      {/* Product info panel */}
      <div style={sectionHeader} onClick={() => setShowInfo(!showInfo)}>
        <span>Product Information</span>
        <span style={{ fontSize: '10px' }}>{showInfo ? '▼' : '▶'}</span>
      </div>
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
            <div style={sectionStyle}>
              {[
                ['Brand', product.brand],
                product.category && ['Category', product.category],
                product.spec && ['Spec', product.spec],
                ['Source', product.source],
                product.country && ['Region', product.country],
                ['Currency', product.currency],
              ].filter(Boolean).map((row: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 5 ? 'var(--border-width) solid var(--border-light)' : 'none', fontSize: '12px', fontWeight: 500 }}>
                  <span style={{ opacity: 0.7, fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{row[0]}</span>
                  <span style={{ fontWeight: 700 }}>{row[1]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cost Calculator */}
      <div style={sectionHeader} onClick={() => setShowCalculator(!showCalculator)}>
        <span>Cost Calculator</span>
        <span style={{ fontSize: '10px' }}>{showCalculator ? '▼' : '▶'}</span>
      </div>
      <AnimatePresence>
        {showCalculator && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
      {isSignedIn ? (
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Cost Estimate <span style={{ fontWeight: 500, opacity: 0.7 }}>(CNY)</span>
          </h2>

          {/* Weight + Dimensions */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ ...labelStyle, marginBottom: '6px' }}>Product Parameters</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '56px', flexShrink: 0 }}>Weight</span>
              <input type="number" step="0.1" min="0" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '24px' }}>KG</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '56px', flexShrink: 0 }}>Dims</span>
              <input type="number" step="0.1" min="0" value={length} onChange={e => setLength(e.target.value)} placeholder="L" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, width: '10px', textAlign: 'center', flexShrink: 0 }}>×</span>
              <input type="number" step="0.1" min="0" value={width} onChange={e => setWidth(e.target.value)} placeholder="W" style={{ ...inputStyle, width: '56px', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, width: '10px', textAlign: 'center', flexShrink: 0 }}>×</span>
              <input type="number" step="0.1" min="0" value={height} onChange={e => setHeight(e.target.value)} placeholder="H" style={{ ...inputStyle, width: '56px', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '24px', flexShrink: 0 }}>CM</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '62px' }}>
              {[{ label: '20L', l: '45', w: '30', h: '18' }, { label: '30L', l: '50', w: '30', h: '22' }, { label: '40L', l: '55', w: '32', h: '25' }, { label: '50L', l: '60', w: '35', h: '28' }, { label: '65L', l: '65', w: '38', h: '30' }, { label: '80L', l: '75', w: '40', h: '35' }].map(p => (
                <button key={p.label} onClick={() => { setLength(p.l); setWidth(p.w); setHeight(p.h) }}
                  style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '3px 6px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <h3 style={{ ...labelStyle, margin: 0 }}>Logistics</h3>
              <button onClick={() => setShowShippingHelp(v => !v)} style={{ width: '14px', height: '14px', borderRadius: '999px', border: 'var(--border-width) solid var(--text-muted)', background: 'none', cursor: 'pointer', fontSize: '10px', lineHeight: '1', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>?</button>
            </div>
            {showShippingHelp && (
              <div style={{ background: 'var(--bg-secondary)', padding: '8px', border: 'var(--border-width) solid var(--border-default)', marginBottom: '6px', fontSize: '10px', lineHeight: '1.4' }}>
                <p><strong>First Weight:</strong> First weight tier + cost</p>
                <p><strong>Add. Weight:</strong> Cost per additional weight unit</p>
                <p><strong>Volume Divisor:</strong> L×W×H(cm) ÷ divisor = volumetric weight</p>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '56px', flexShrink: 0 }}>Carrier</span>
              <select value={selectedCarrierId ?? ''} onChange={e => {
                const id = parseInt(e.target.value, 10); setSelectedCarrierId(id)
                const c = carriers.find(x => x.id === id)
                if (c) { setFirstWeight(String(c.firstWeight)); setFirstCost(String(c.firstCost)); setAdditionalWeight(String(c.additionalWeight)); setAdditionalCost(String(c.additionalCost)); setVolumeDivisor(String(c.volumeDivisor)) }
              }} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Custom</option>
                {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ paddingLeft: '62px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '32px' }}>First</span>
                <input type="number" step="0.1" min="0" value={firstWeight} onChange={e => setFirstWeight(e.target.value)} style={{ ...inputStyle, width: '52px' }} /><span style={{ fontSize: 'var(--fs-label)', fontWeight: 800 }}>kg</span>
                <input type="number" step="0.01" min="0" value={firstCost} onChange={e => setFirstCost(e.target.value)} style={{ ...inputStyle, width: '52px' }} /><span style={{ fontSize: 'var(--fs-label)', fontWeight: 800 }}>¥</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '32px' }}>Add.</span>
                <input type="number" step="0.1" min="0" value={additionalWeight} onChange={e => setAdditionalWeight(e.target.value)} style={{ ...inputStyle, width: '52px' }} /><span style={{ fontSize: 'var(--fs-label)', fontWeight: 800 }}>kg</span>
                <input type="number" step="0.01" min="0" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)} style={{ ...inputStyle, width: '52px' }} /><span style={{ fontSize: 'var(--fs-label)', fontWeight: 800 }}>¥</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '32px' }}>VolDiv</span>
                <input type="number" step="100" min="1000" value={volumeDivisor} onChange={e => setVolumeDivisor(e.target.value)} style={{ ...inputStyle, width: '72px' }} />
              </div>
            </div>
          </div>

          {/* Profit */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ ...labelStyle, marginBottom: '6px' }}>Profit Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '56px', flexShrink: 0 }}>Extra</span>
                <input type="number" step="0.01" min="0" value={extraCost} onChange={e => setExtraCost(e.target.value)} style={{ ...inputStyle, width: '96px', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>¥</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', width: '56px', flexShrink: 0 }}>Margin</span>
                <input type="number" step="1" min="0" max="99" value={marginRate} onChange={e => setMarginRate(e.target.value)} style={{ ...inputStyle, width: '96px', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>%</span>
              </div>
            </div>
          </div>

          <button onClick={calcEstimate} disabled={estimating}
            style={{ width: '100%', background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', opacity: estimating ? 0.4 : 1 }}>
            {estimating ? 'Calculating...' : 'Calculate Landed Cost'}
          </button>

          {estimateError && <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)', textAlign: 'center', marginTop: '8px' }}>{estimateError}</p>}

          <AnimatePresence>
            {estimate && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-default)', padding: '16px', marginTop: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Landed Cost</div>
                  <div style={{ fontSize: '32px', lineHeight: '1', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{estimate.estimatedCostFormatted}</div>
                </div>
                <div style={{ borderTop: 'var(--border-width) solid var(--border-default)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Converted Price</span><span style={{ fontWeight: 700 }}>{estimate.convertedPriceFormatted}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Rate</span><span style={{ fontSize: '13px' }}>{estimate.exchangeRate.source} · {estimate.exchangeRate.rate}</span></div>
                  {estimate.shippingEstimate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Shipping</span><span style={{ fontWeight: 700 }}>¥{estimate.shippingEstimate.cost} <span style={{ fontSize: '13px', opacity: 0.7 }}>({estimate.shippingEstimate.label})</span></span></div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Extra</span><span style={{ fontWeight: 700 }}>¥{estimate.extraCost}</span></div>
                </div>
                {estimate.profitTrial && (
                  <>
                    <div style={{ borderTop: 'var(--border-width) solid var(--border-default)', paddingTop: '8px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Margin</span><span>{estimate.profitTrial.estimatedMarginRate}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>Suggested Price</span><span style={{ fontWeight: 700 }}>{estimate.profitTrial.suggestedQuotePrice}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Profit</span>
                        <span style={{ fontWeight: 900, fontSize: '16px', color: estimate.profitTrial.status === 'positive' ? 'var(--success)' : 'var(--danger)' }}>{estimate.profitTrial.estimatedProfit}</span>
                      </div>
                    </div>
                  </>
                )}
                <button onClick={shareResult} style={{ width: '100%', marginTop: '12px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '6px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Share Result
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Login to use cost estimation</p>
          <button onClick={() => openLogin()} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '8px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Login</button>
        </div>
      )}
            </motion.div>
          )}
        </AnimatePresence>

      {/* Price history */}
      {(product.originalPrice || product.updatedAt) && (
        <>
          <div style={sectionHeader} onClick={() => setShowHistory(!showHistory)}>
            <span>Price History</span>
            <span style={{ fontSize: '10px' }}>{showHistory ? '▼' : '▶'}</span>
          </div>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                <div style={sectionStyle}>
                  <h3 style={{ ...labelStyle, marginBottom: '8px' }}>Price History</h3>
                  {product.originalPrice && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                        <span style={{ opacity: 0.7 }}>Original</span>
                        <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{formatPrice(product.currency, product.originalPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ opacity: 0.7 }}>Current</span>
                        <span style={{ fontWeight: 700 }}>{formatPrice(product.currency, product.price)}</span>
                      </div>
                    </div>
                  )}
                  {product.updatedAt && (
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>
                      Updated: {new Date(product.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Actions */}
      <div style={{ ...sectionStyle, borderBottom: 'none' }}>
        {isSignedIn ? (
          <button onClick={toggleFavorite} disabled={favToggling}
            style={{ width: '100%', background: favorited ? 'var(--bg-primary)' : 'var(--bg-active)', color: favorited ? 'var(--danger)' : 'var(--text-inverse)', border: favorited ? 'var(--border-width) solid var(--danger)' : 'none', padding: '12px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginBottom: '8px' }}>
            {favorited ? 'Saved' : 'Save to Favorites'}
          </button>
        ) : (
          <button onClick={() => openLogin()} style={{ width: '100%', background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '12px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginBottom: '8px' }}>
            Login to Save
          </button>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => { if (product?.sourceUrl) window.open(product.sourceUrl, '_blank', 'noopener,noreferrer') }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Open Source
          </button>
          <button onClick={() => {
            if (!product?.sourceUrl) return
            navigator.clipboard.writeText(product.sourceUrl).then(() => { setSourceCopied(true); setTimeout(() => setSourceCopied(false), 2000) }).catch(() => {})
          }}
            style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>
            {sourceCopied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Cross-source comparison */}
      {crossSource && crossSource.length > 0 && (
        <div style={{ ...sectionStyle, borderBottom: 'none', marginTop: '12px', borderTop: 'var(--border-width) solid var(--border-default)' }}>
          <h3 style={{ ...labelStyle, marginBottom: '8px' }}>Other Sources</h3>
          {crossSource.slice(0, 5).map((item: any) => (
            <button key={item.id} onClick={() => nav(`/product/${item.id}`)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '8px', marginBottom: '4px', cursor: 'pointer', textAlign: 'left' }}>
              <img src={item.imageUrl || getPlaceholderUrl('N/A', 40, 40)} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 40, 40) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>{item.source}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatPrice(item.currency, item.price)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

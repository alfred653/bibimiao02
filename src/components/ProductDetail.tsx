import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiPost, apiDelete } from '../lib/api-client'

interface Carrier {
  id: number
  name: string
  firstWeight: number
  firstCost: number
  additionalWeight: number
  additionalCost: number
  volumeDivisor: number
  isActive: string
}

const TARGET_CURRENCIES = ['CNY', 'USD', 'JPY', 'EUR', 'GBP', 'HKD']

interface EstimateResult {
  convertedPriceFormatted: string
  exchangeRate: { rate: number; source: string }
  shippingEstimate?: { cost: number; label: string }
  extraCost: number
  estimatedCostFormatted: string
  profitTrial?: {
    suggestedQuotePrice: string
    estimatedProfit: string
    estimatedMarginRate: string
    status: string
  }
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

  // Carrier dropdown
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null)

  useEffect(() => {
    api('/api/shipping-carriers')
      .then(r => r.json())
      .then(d => { if (d.success) setCarriers(d.data) })
      .catch((e) => console.warn('Failed to load carriers:', e))
  }, [])

  useEffect(() => {
    if (!isSignedIn) { openLogin(); return }
    api(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProduct(d.data)
          setFavorited(d.data.favorited)
        }
      })
      .finally(() => setLoading(false))
  }, [id, isSignedIn])

  const [displayCurrency, setDisplayCurrency] = useState('')
  const [dispRate, setDispRate] = useState<{ rate: number; source: string } | null>(null)
  const [dispConverted, setDispConverted] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)

  useEffect(() => {
    if (product) setDisplayCurrency(product.currency || 'CNY')
  }, [product])

  useEffect(() => {
    if (!product || !displayCurrency || displayCurrency === (product.currency || 'CNY')) {
      setDispRate(null)
      setDispConverted(null)
      return
    }
    setRateLoading(true)
    api(`/api/exchange-rate?from=${encodeURIComponent(product.currency || 'CNY')}&to=${encodeURIComponent(displayCurrency)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setDispRate({ rate: d.data.rate, source: d.data.source })
          setDispConverted(Math.round((parseFloat(product.price) || 0) * d.data.rate * 100) / 100)
        }
      })
      .catch(() => { setDispRate(null); setDispConverted(null) })
      .finally(() => setRateLoading(false))
  }, [displayCurrency, product])

  function calcEstimate() {
    if (!product) return
    setEstimating(true)
    setEstimateError('')
    apiPost('/api/cost-estimate', {
        price: product.price,
        currency: product.currency || 'CNY',
        targetCurrency: 'CNY',
        shipping: {
          mode: 'custom',
          firstWeight: parseFloat(firstWeight) || 0,
          firstCost: parseFloat(firstCost) || 0,
          additionalWeight: parseFloat(additionalWeight) || 0,
          additionalCost: parseFloat(additionalCost) || 0,
          volumeDivisor: parseFloat(volumeDivisor) || 6000,
          weight: parseFloat(weight) || 0,
          length: parseFloat(length) || 0,
          width: parseFloat(width) || 0,
          height: parseFloat(height) || 0,
        },
        extraCost: parseFloat(extraCost) || 0,
        targetMarginRate: parseFloat(marginRate) || undefined,
      })
      .then(r => r.json())
      .then(d => {
        if (d.success) setEstimate(d.data)
        else setEstimateError(d.error?.message || '计算失败')
      })
      .catch((e: Error) => setEstimateError(e.message || '网络错误'))
      .finally(() => setEstimating(false))
  }

  function toggleFavorite() {
    if (!product) return
    setFavToggling(true)
    const fetcher = favorited
      ? apiDelete('/api/favorites', { productId: product.id })
      : apiPost('/api/favorites', { productId: product.id })
    fetcher
      .then(r => r.json())
      .then(d => { if (d.success) setFavorited(!favorited) })
      .finally(() => setFavToggling(false))
  }

  function copyResult() {
    if (!estimate || !product) return
    const lines = [
      `${product.title}`,
      `价格: ${product.currency} ${product.price}`,
      `汇率: 1 ${product.currency} = ${estimate.exchangeRate.rate} CNY`,
      `换算: ${estimate.convertedPriceFormatted}`,
    ]
    if (estimate.shippingEstimate) {
      lines.push(`运费: ${estimate.shippingEstimate.cost} (${estimate.shippingEstimate.label})`)
    }
    lines.push(`其他费用: ${estimate.extraCost}`)
    lines.push(`总成本: ${estimate.estimatedCostFormatted}`)
    if (estimate.profitTrial) {
      lines.push(`建议售价: ${estimate.profitTrial.suggestedQuotePrice}`)
      lines.push(`预估利润: ${estimate.profitTrial.estimatedProfit}`)
      lines.push(`毛利率: ${estimate.profitTrial.estimatedMarginRate}`)
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => toast('已复制到剪贴板', 'success')).catch(() => {})
  }

  if (!isSignedIn) return <div className="p-8 text-center text-[var(--text-secondary)]">请先登录</div>
  if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">加载中...</div>
  if (!product) return (
    <div className="p-8 text-center">
      <p className="text-[var(--text-secondary)] mb-4">商品不存在或已下架</p>
      <button onClick={() => nav('/search')} className="bg-[var(--brand)] text-[var(--button-on-brand)] px-5 py-2 rounded-lg text-sm active:bg-[var(--brand-hover)] transition-colors">去搜索</button>
    </div>
  )

  return (
    <div className="p-4">
      <button onClick={() => nav(-1)} className="text-[var(--text-secondary)] text-sm mb-4 hover:text-[var(--text-primary)] transition-colors">← 返回</button>

      <img
        src={product.imageUrl || `https://placehold.co/800x400/1a1a17/d97757?text=${encodeURIComponent(product.brand || '')}`}
        alt=""
        className="w-full h-48 object-cover rounded-xl bg-[var(--bg-card)] mb-4"
        loading="lazy"
        onError={e => {
          const el = e.target as HTMLImageElement
          el.src = `https://placehold.co/800x400/1a1a17/666?text=${encodeURIComponent('No Image')}`
        }}
      />

      <h1 className="text-lg font-bold mb-2">{product.title}</h1>
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="bg-[var(--brand-soft)] text-[var(--brand)] px-2 py-0.5 rounded">{product.brand}</span>
        {product.category && <span className="bg-[var(--bg-card)] text-[var(--text-secondary)] px-2 py-0.5 rounded">{product.category}</span>}
        {product.spec && <span className="bg-[var(--bg-card)] text-[var(--text-secondary)] px-2 py-0.5 rounded">{product.spec}</span>}
      </div>

      {/* Basic info */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">价格</span>
          <span className="text-[var(--brand)] font-bold text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>{product.currency} {product.price}</span>
        </div>
        {product.originalPrice && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">原价</span>
            <span className="text-[var(--text-secondary)] line-through">{product.currency} {product.originalPrice}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-secondary)] text-xs">切换币种</span>
          <select
            value={displayCurrency}
            onChange={e => setDisplayCurrency(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)]"
          >
            {TARGET_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {rateLoading && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">获取汇率中...</span>
          </div>
        )}
        {dispRate && dispConverted !== null && !rateLoading && (
          <>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)] text-xs">换算价格</span>
              <span className="text-[var(--success)] font-bold">{displayCurrency} {dispConverted.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">汇率</span>
              <span className="text-[var(--text-secondary)]">
                1 {product.currency} = {dispRate.rate} {displayCurrency}
                <span className="text-[var(--text-muted)] ml-1">
                  · {dispRate.source === 'frankfurter' ? 'Frankfurter 实时' : dispRate.source === 'cache' ? '缓存' : '预设'}
                </span>
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-secondary)]">来源</span>
          <span>{product.source}</span>
        </div>
        {product.country && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">地区</span>
            <span>{product.country}</span>
          </div>
        )}
      </div>

      {/* Cost Estimate Panel */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold mb-4 text-[var(--text-primary)]">
          成本估算 <span className="text-xs text-[var(--text-secondary)] font-normal">(CNY)</span>
        </h2>

        <div className="space-y-4">
          {/* Group 1: 商品参数 */}
          <div>
            <h3 className="text-[11px] text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wide">商品参数</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-[var(--text-secondary)] w-12 sm:w-16 shrink-0">重量</span>
                <input
                  type="number" step="0.1" min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="kg"
                  className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 sm:px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
                <span className="text-xs text-[var(--text-secondary)] w-5 shrink-0">kg</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-[var(--text-secondary)] w-12 sm:w-16 shrink-0">尺寸</span>
                <span className="text-[10px] text-[var(--text-secondary)] w-3 sm:w-4 shrink-0">长</span>
                <input type="number" step="0.1" min="0" value={length} onChange={e => setLength(e.target.value)} placeholder="0" className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1 sm:px-2 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
                <span className="text-[var(--text-secondary)] text-xs shrink-0">×</span>
                <span className="text-[10px] text-[var(--text-secondary)] w-3 sm:w-4 shrink-0">宽</span>
                <input type="number" step="0.1" min="0" value={width} onChange={e => setWidth(e.target.value)} placeholder="0" className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1 sm:px-2 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
                <span className="text-[var(--text-secondary)] text-xs shrink-0">×</span>
                <span className="text-[10px] text-[var(--text-secondary)] w-3 sm:w-4 shrink-0">高</span>
                <input type="number" step="0.1" min="0" value={height} onChange={e => setHeight(e.target.value)} placeholder="0" className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1 sm:px-2 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
                <span className="text-[10px] text-[var(--text-secondary)] w-5 sm:w-7 shrink-0">cm</span>
              </div>
            </div>
          </div>

          {/* Group 2: 物流方案 */}
          <div>
            <h3 className="text-[11px] text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wide">物流方案</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)] w-12 sm:w-16 shrink-0">快递</span>
                <select
                  value={selectedCarrierId ?? ''}
                  onChange={e => {
                    const id = parseInt(e.target.value, 10)
                    setSelectedCarrierId(id)
                    const c = carriers.find(x => x.id === id)
                    if (c) {
                      setFirstWeight(String(c.firstWeight))
                      setFirstCost(String(c.firstCost))
                      setAdditionalWeight(String(c.additionalWeight))
                      setAdditionalCost(String(c.additionalCost))
                      setVolumeDivisor(String(c.volumeDivisor))
                    }
                  }}
                  className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="">自定义参数</option>
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="pl-12 sm:pl-16 space-y-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-6 shrink-0">首重</span>
                  <input type="number" step="0.1" min="0" value={firstWeight} onChange={e => setFirstWeight(e.target.value)} className="w-14 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)]" />
                  <span className="text-[10px] text-[var(--text-secondary)] shrink-0">kg</span>
                  <input type="number" step="0.01" min="0" value={firstCost} onChange={e => setFirstCost(e.target.value)} className="w-14 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)]" />
                  <span className="text-[10px] text-[var(--text-secondary)] shrink-0">元</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-6 shrink-0">续重</span>
                  <input type="number" step="0.1" min="0" value={additionalWeight} onChange={e => setAdditionalWeight(e.target.value)} className="w-14 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)]" />
                  <span className="text-[10px] text-[var(--text-secondary)] shrink-0">kg</span>
                  <input type="number" step="0.01" min="0" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)} className="w-14 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)]" />
                  <span className="text-[10px] text-[var(--text-secondary)] shrink-0">元</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-6 shrink-0">体积除数</span>
                  <input type="number" step="100" min="1000" value={volumeDivisor} onChange={e => setVolumeDivisor(e.target.value)} className="w-16 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">（长×宽×高÷除数 = 体积重）</span>
                </div>
              </div>
            </div>
          </div>

          {/* Group 3: 利润设置 */}
          <div>
            <h3 className="text-[11px] text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wide">利润设置</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-[var(--text-secondary)] w-12 sm:w-16 shrink-0">其他费用</span>
                <input type="number" step="0.01" min="0" value={extraCost} onChange={e => setExtraCost(e.target.value)} className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 sm:px-3 py-2 text-sm text-[var(--text-primary)]" />
                <span className="text-xs text-[var(--text-secondary)] w-4 shrink-0">¥</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-[var(--text-secondary)] shrink-0">目标毛利率</span>
                <input type="number" step="1" min="0" max="99" value={marginRate} onChange={e => setMarginRate(e.target.value)} className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 sm:px-3 py-2 text-sm text-[var(--text-primary)]" />
                <span className="text-xs text-[var(--text-secondary)] w-4 shrink-0">%</span>
              </div>
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calcEstimate}
            disabled={estimating}
            className="w-full bg-[var(--brand)] py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors"
          >
            {estimating ? '计算中...' : '计算到手成本'}
          </button>

          {estimateError && (
            <p className="text-[var(--danger)] text-xs text-center">{estimateError}</p>
          )}

          {/* Results - Enhanced */}
          {estimate && (
            <div className="bg-[var(--bg-input)] rounded-xl p-4 space-y-2">
              {/* Total cost - prominent */}
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] mb-1">预计到手成本</p>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{estimate.estimatedCostFormatted}</p>
              </div>

              <hr className="border-[var(--border-subtle)]" />

              {/* Fee breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">商品价格折合</span>
                  <span className="text-[var(--brand)] font-medium">{estimate.convertedPriceFormatted}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">汇率</span>
                  <span className="text-[var(--text-muted)]">{estimate.exchangeRate.source} · {estimate.exchangeRate.rate}</span>
                </div>
                {estimate.shippingEstimate && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">国际运费</span>
                    <span>¥{estimate.shippingEstimate.cost} <span className="text-[10px] text-[var(--text-muted)]">({estimate.shippingEstimate.label})</span></span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">其他费用</span>
                  <span>¥{estimate.extraCost}</span>
                </div>
              </div>

              {estimate.profitTrial && (
                <>
                  <hr className="border-[var(--border-subtle)]" />
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">目标毛利率</span>
                      <span className="text-[var(--text-muted)]">{estimate.profitTrial.estimatedMarginRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">建议售价</span>
                      <span className="font-bold">{estimate.profitTrial.suggestedQuotePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">预计毛利</span>
                      <span className={`font-bold text-base ${estimate.profitTrial.status === 'positive' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {estimate.profitTrial.estimatedProfit}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={copyResult}
                className="w-full mt-2 bg-[var(--bg-card)] py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
              >
                复制结果
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <button
        onClick={toggleFavorite}
        disabled={favToggling}
        className={`w-full py-3 rounded-xl text-sm font-medium mb-2 transition-colors ${favorited ? 'bg-[var(--brand-soft)] text-[var(--danger)] border border-[var(--danger)]' : 'bg-[var(--brand)] text-[var(--button-on-brand)] active:bg-[var(--brand-hover)]'}`}
      >
        {favorited ? '已收藏' : '收藏'}
      </button>
      <button
        onClick={() => {
          if (!product?.sourceUrl) return
          navigator.clipboard.writeText(product.sourceUrl).then(() => {
            setSourceCopied(true)
            setTimeout(() => setSourceCopied(false), 2000)
          }).catch(() => {})
        }}
        className="w-full bg-[var(--bg-card)] py-3 rounded-xl text-sm hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
      >
        {sourceCopied ? '已复制链接' : '复制来源链接'}
      </button>
    </div>
  )
}

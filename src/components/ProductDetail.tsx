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

  if (!isSignedIn) return <div className="p-8 text-center text-[#b0aea5]">请先登录</div>
  if (loading) return <div className="p-8 text-center text-[#b0aea5]">加载中...</div>
  if (!product) return <div className="p-8 text-center text-[#b0aea5]">商品不存在</div>

  return (
    <div className="p-4">
      <button onClick={() => nav(-1)} className="text-[#b0aea5] text-sm mb-4 hover:text-[#faf9f5] transition-colors">← 返回</button>

      <img
        src={product.imageUrl || `https://placehold.co/800x400/1a1a17/d97757?text=${encodeURIComponent(product.brand || '')}`}
        alt=""
        className="w-full h-48 object-cover rounded-xl bg-white/[0.04] mb-4"
        loading="lazy"
        onError={e => {
          const el = e.target as HTMLImageElement
          el.src = `https://placehold.co/800x400/1a1a17/666?text=${encodeURIComponent('No Image')}`
        }}
      />

      <h1 className="text-lg font-bold mb-2">{product.title}</h1>
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="bg-[#d97757]/10 text-[#d97757] px-2 py-0.5 rounded">{product.brand}</span>
        {product.category && <span className="bg-white/[0.04] text-[#b0aea5] px-2 py-0.5 rounded">{product.category}</span>}
        {product.spec && <span className="bg-white/[0.04] text-[#b0aea5] px-2 py-0.5 rounded">{product.spec}</span>}
      </div>

      {/* Basic info */}
      <div className="bg-white/[0.04] rounded-xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[#b0aea5]">价格</span>
          <span className="text-[#d97757] font-bold text-lg">{product.currency} {product.price}</span>
        </div>
        {product.originalPrice && (
          <div className="flex justify-between">
            <span className="text-[#b0aea5]">原价</span>
            <span className="text-[#b0aea5] line-through">{product.currency} {product.originalPrice}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1 border-t border-white/[0.06]">
          <span className="text-[#b0aea5] text-xs">切换币种</span>
          <select
            value={displayCurrency}
            onChange={e => setDisplayCurrency(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700"
          >
            {TARGET_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {rateLoading && (
          <div className="flex justify-between text-xs">
            <span className="text-[#b0aea5]">获取汇率中...</span>
          </div>
        )}
        {dispRate && dispConverted !== null && !rateLoading && (
          <>
            <div className="flex justify-between">
              <span className="text-[#b0aea5] text-xs">换算价格</span>
              <span className="text-[#788c5d] font-bold">{displayCurrency} {dispConverted.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#b0aea5]">汇率</span>
              <span className="text-[#b0aea5]">
                1 {product.currency} = {dispRate.rate} {displayCurrency}
                <span className="text-[#b0aea5]/60 ml-1">
                  · {dispRate.source === 'frankfurter' ? 'Frankfurter 实时' : dispRate.source === 'cache' ? '缓存' : '预设'}
                </span>
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between pt-1 border-t border-white/[0.06]">
          <span className="text-[#b0aea5]">来源</span>
          <span>{product.source}</span>
        </div>
        {product.country && (
          <div className="flex justify-between">
            <span className="text-[#b0aea5]">地区</span>
            <span>{product.country}</span>
          </div>
        )}
      </div>

      {/* Cost Estimate Panel */}
      <div className="bg-white/[0.04] rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold mb-3 text-[#faf9f5]">
          成本估算 <span className="text-xs text-[#b0aea5] font-normal">(CNY)</span>
        </h2>

        <div className="space-y-3">
          {/* Shipping params */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#b0aea5] w-12 sm:w-16 shrink-0">快递</span>
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
                className="flex-1 min-w-0 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700"
              >
                <option value="">自定义参数</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="pl-12 sm:pl-16 space-y-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] text-[#b0aea5] w-6 shrink-0">首重</span>
                <input type="number" step="0.1" min="0" value={firstWeight} onChange={e => setFirstWeight(e.target.value)}
                  className="w-14 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1.5 py-1.5 text-xs text-[#faf9f5]" />
                <span className="text-[10px] text-[#b0aea5] shrink-0">kg</span>
                <input type="number" step="0.01" min="0" value={firstCost} onChange={e => setFirstCost(e.target.value)}
                  className="w-14 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1.5 py-1.5 text-xs text-[#faf9f5]" />
                <span className="text-[10px] text-[#b0aea5] shrink-0">元</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] text-[#b0aea5] w-6 shrink-0">续重</span>
                <input type="number" step="0.1" min="0" value={additionalWeight} onChange={e => setAdditionalWeight(e.target.value)}
                  className="w-14 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1.5 py-1.5 text-xs text-[#faf9f5]" />
                <span className="text-[10px] text-[#b0aea5] shrink-0">kg</span>
                <input type="number" step="0.01" min="0" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)}
                  className="w-14 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1.5 py-1.5 text-xs text-[#faf9f5]" />
                <span className="text-[10px] text-[#b0aea5] shrink-0">元</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] text-[#b0aea5] w-6 shrink-0">体积除数</span>
                <input type="number" step="100" min="1000" value={volumeDivisor} onChange={e => setVolumeDivisor(e.target.value)}
                  className="w-16 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1.5 py-1.5 text-xs text-[#faf9f5]" />
                <span className="text-[10px] text-[#b0aea5]/70">（长×宽×高÷除数 = 体积重）</span>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-[#b0aea5] w-12 sm:w-16 shrink-0">重量</span>
            <input
              type="number" step="0.1" min="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="kg"
              className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]"
            />
            <span className="text-xs text-[#b0aea5] w-5 shrink-0">kg</span>
          </div>

          {/* Dimensions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-[#b0aea5] w-12 sm:w-16 shrink-0">尺寸</span>
            <span className="text-[10px] text-[#b0aea5] w-3 sm:w-4 shrink-0">长</span>
            <input
              type="number" step="0.1" min="0"
              value={length}
              onChange={e => setLength(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]"
            />
            <span className="text-[#b0aea5] text-xs shrink-0">×</span>
            <span className="text-[10px] text-[#b0aea5] w-3 sm:w-4 shrink-0">宽</span>
            <input
              type="number" step="0.1" min="0"
              value={width}
              onChange={e => setWidth(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]"
            />
            <span className="text-[#b0aea5] text-xs shrink-0">×</span>
            <span className="text-[10px] text-[#b0aea5] w-3 sm:w-4 shrink-0">高</span>
            <input
              type="number" step="0.1" min="0"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]"
            />
            <span className="text-[10px] text-[#b0aea5] w-5 sm:w-7 shrink-0">cm</span>
          </div>

          {/* Extra cost + margin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-[#b0aea5] w-12 sm:w-16 shrink-0">其他费用</span>
              <input
                type="number" step="0.01" min="0"
                value={extraCost}
                onChange={e => setExtraCost(e.target.value)}
                className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#faf9f5]"
              />
              <span className="text-xs text-[#b0aea5] w-4 shrink-0">¥</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-[#b0aea5] shrink-0">毛利率</span>
              <input
                type="number" step="1" min="0" max="99"
                value={marginRate}
                onChange={e => setMarginRate(e.target.value)}
                className="flex-1 min-w-0 bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#faf9f5]"
              />
              <span className="text-xs text-[#b0aea5] w-4 shrink-0">%</span>
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calcEstimate}
            disabled={estimating}
            className="w-full bg-[#d97757] py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 active:bg-[#c45e3e] transition-colors"
          >
            {estimating ? '计算中...' : '计算'}
          </button>

          {estimateError && (
            <p className="text-[#b53333] text-xs text-center">{estimateError}</p>
          )}

          {/* Results */}
          {estimate && (
            <div className="bg-white/[0.04] rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#b0aea5]">换算价格</span>
                <span className="text-[#d97757] font-bold">{estimate.convertedPriceFormatted}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#b0aea5]">汇率来源</span>
                <span className="text-[#b0aea5]">{estimate.exchangeRate.source} · {estimate.exchangeRate.rate}</span>
              </div>
              {estimate.shippingEstimate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#b0aea5]">运费</span>
                    <span>¥{estimate.shippingEstimate.cost}</span>
                  </div>
                  <p className="text-[10px] text-[#b0aea5] break-all">{estimate.shippingEstimate.label}</p>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-[#b0aea5]">其他费用</span>
                <span>¥{estimate.extraCost}</span>
              </div>
              <hr className="border-white/[0.06] my-1" />
              <div className="flex justify-between font-bold">
                <span>总成本</span>
                <span className="text-[#d97757]">{estimate.estimatedCostFormatted}</span>
              </div>

              {estimate.profitTrial && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#b0aea5]">目标毛利率</span>
                    <span>{estimate.profitTrial.estimatedMarginRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#b0aea5]">建议售价</span>
                    <span className="text-[#788c5d] font-bold">{estimate.profitTrial.suggestedQuotePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#b0aea5]">预估利润</span>
                    <span className={estimate.profitTrial.status === 'positive' ? 'text-[#788c5d]' : 'text-[#b53333]'}>
                      {estimate.profitTrial.estimatedProfit}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={copyResult}
                className="w-full mt-2 bg-white/[0.06] py-1.5 rounded text-xs text-[#b0aea5] hover:bg-white/[0.08] active:bg-white/[0.10] transition-colors"
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
        className={`w-full py-3 rounded-xl text-sm font-medium mb-2 transition-colors ${favorited ? 'bg-[#b53333]/15 text-[#b53333] border border-[#b53333]/20' : 'bg-[#d97757] text-white active:bg-[#c45e3e]'}`}
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
        className="w-full bg-white/[0.04] py-3 rounded-xl text-sm hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
      >
        {sourceCopied ? '已复制链接' : '复制来源链接'}
      </button>
    </div>
  )
}

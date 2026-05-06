import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiPost, apiDelete } from '../lib/api-client'

const SHIPPING_MODES = [
  { value: 'standard', label: '普通线', hint: '首重0.5kg ￥32, 续重0.5kg ￥10' },
  { value: 'sensitive', label: '特货线', hint: '首重0.5kg ￥42, 续重0.5kg ￥12' },
  { value: 'large', label: '大货线', hint: '首重1.0kg ￥58, 续重0.5kg ￥11' },
]

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

  const [shipMode, setShipMode] = useState('standard')
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
          mode: shipMode,
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

  if (!isSignedIn) return <div className="p-8 text-center text-[#8b8a7e]">请先登录</div>
  if (loading) return <div className="p-8 text-center text-[#8b8a7e]">加载中...</div>
  if (!product) return <div className="p-8 text-center text-[#8b8a7e]">商品不存在</div>

  return (
    <div className="p-4">
      <button onClick={() => nav(-1)} className="text-[#8b8a7e] text-sm mb-4 hover:text-[#f0ede5] transition-colors">← 返回</button>

      <img
        src={product.imageUrl || `https://placehold.co/800x400/1a1a17/d97706?text=${encodeURIComponent(product.brand || '')}`}
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
        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">{product.brand}</span>
        {product.category && <span className="bg-white/[0.04] text-[#8b8a7e] px-2 py-0.5 rounded">{product.category}</span>}
        {product.spec && <span className="bg-white/[0.04] text-[#8b8a7e] px-2 py-0.5 rounded">{product.spec}</span>}
      </div>

      {/* Basic info */}
      <div className="bg-white/[0.04] rounded-xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[#8b8a7e]">价格</span>
          <span className="text-amber-500 font-bold text-lg">{product.currency} {product.price}</span>
        </div>
        {product.originalPrice && (
          <div className="flex justify-between">
            <span className="text-[#8b8a7e]">原价</span>
            <span className="text-[#8b8a7e] line-through">{product.currency} {product.originalPrice}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1 border-t border-white/[0.06]">
          <span className="text-[#8b8a7e] text-xs">切换币种</span>
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
            <span className="text-[#8b8a7e]">获取汇率中...</span>
          </div>
        )}
        {dispRate && dispConverted !== null && !rateLoading && (
          <>
            <div className="flex justify-between">
              <span className="text-[#8b8a7e] text-xs">换算价格</span>
              <span className="text-emerald-400 font-bold">{displayCurrency} {dispConverted.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#8b8a7e]">汇率</span>
              <span className="text-[#8b8a7e]">
                1 {product.currency} = {dispRate.rate} {displayCurrency}
                <span className="text-[#8b8a7e]/60 ml-1">
                  · {dispRate.source === 'frankfurter' ? 'Frankfurter 实时' : dispRate.source === 'cache' ? '缓存' : '预设'}
                </span>
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between pt-1 border-t border-white/[0.06]">
          <span className="text-[#8b8a7e]">来源</span>
          <span>{product.source}</span>
        </div>
        {product.country && (
          <div className="flex justify-between">
            <span className="text-[#8b8a7e]">地区</span>
            <span>{product.country}</span>
          </div>
        )}
      </div>

      {/* Cost Estimate Panel */}
      <div className="bg-white/[0.04] rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold mb-3 text-[#f0ede5]">
          成本估算 <span className="text-xs text-[#8b8a7e] font-normal">(CNY)</span>
        </h2>

        <div className="space-y-3">
          {/* Shipping mode */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b8a7e] w-12 sm:w-16 shrink-0">运费模板</span>
              <select
                value={shipMode}
                onChange={e => setShipMode(e.target.value)}
                className="flex-1 min-w-0 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm text-gray-700"
              >
                {SHIPPING_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-[#8b8a7e] mt-0.5 pl-12 sm:pl-16">
              {SHIPPING_MODES.find(m => m.value === shipMode)?.hint}
            </p>
          </div>

          {/* Weight */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-[#8b8a7e] w-12 sm:w-16 shrink-0">重量</span>
            <input
              type="number" step="0.1" min="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="kg"
              className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#f0ede5] placeholder-[#8b8a7e]"
            />
            <span className="text-xs text-[#8b8a7e] w-5 shrink-0">kg</span>
          </div>

          {/* Dimensions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-[#8b8a7e] w-12 sm:w-16 shrink-0">尺寸</span>
            <span className="text-[10px] text-[#8b8a7e] w-3 sm:w-4 shrink-0">长</span>
            <input
              type="number" step="0.1" min="0"
              value={length}
              onChange={e => setLength(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#f0ede5] placeholder-[#8b8a7e]"
            />
            <span className="text-[#8b8a7e] text-xs shrink-0">×</span>
            <span className="text-[10px] text-[#8b8a7e] w-3 sm:w-4 shrink-0">宽</span>
            <input
              type="number" step="0.1" min="0"
              value={width}
              onChange={e => setWidth(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#f0ede5] placeholder-[#8b8a7e]"
            />
            <span className="text-[#8b8a7e] text-xs shrink-0">×</span>
            <span className="text-[10px] text-[#8b8a7e] w-3 sm:w-4 shrink-0">高</span>
            <input
              type="number" step="0.1" min="0"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-1 sm:px-2 py-2 text-sm text-[#f0ede5] placeholder-[#8b8a7e]"
            />
            <span className="text-[10px] text-[#8b8a7e] w-5 sm:w-7 shrink-0">cm</span>
          </div>

          {/* Extra cost + margin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-[#8b8a7e] w-12 sm:w-16 shrink-0">其他费用</span>
              <input
                type="number" step="0.01" min="0"
                value={extraCost}
                onChange={e => setExtraCost(e.target.value)}
                className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#f0ede5]"
              />
              <span className="text-xs text-[#8b8a7e] w-4 shrink-0">¥</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-[#8b8a7e] shrink-0">毛利率</span>
              <input
                type="number" step="1" min="0" max="99"
                value={marginRate}
                onChange={e => setMarginRate(e.target.value)}
                className="flex-1 min-w-0 bg-[#1a1a17] border border-white/[0.08] rounded-lg px-2 sm:px-3 py-2 text-sm text-[#f0ede5]"
              />
              <span className="text-xs text-[#8b8a7e] w-4 shrink-0">%</span>
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calcEstimate}
            disabled={estimating}
            className="w-full bg-amber-600 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 active:bg-amber-700 transition-colors"
          >
            {estimating ? '计算中...' : '计算'}
          </button>

          {estimateError && (
            <p className="text-red-400 text-xs text-center">{estimateError}</p>
          )}

          {/* Results */}
          {estimate && (
            <div className="bg-white/[0.04] rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8b8a7e]">换算价格</span>
                <span className="text-amber-500 font-bold">{estimate.convertedPriceFormatted}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8b8a7e]">汇率来源</span>
                <span className="text-[#8b8a7e]">{estimate.exchangeRate.source} · {estimate.exchangeRate.rate}</span>
              </div>
              {estimate.shippingEstimate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#8b8a7e]">运费</span>
                    <span>¥{estimate.shippingEstimate.cost}</span>
                  </div>
                  <p className="text-[10px] text-[#8b8a7e] break-all">{estimate.shippingEstimate.label}</p>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-[#8b8a7e]">其他费用</span>
                <span>¥{estimate.extraCost}</span>
              </div>
              <hr className="border-white/[0.06] my-1" />
              <div className="flex justify-between font-bold">
                <span>总成本</span>
                <span className="text-amber-500">{estimate.estimatedCostFormatted}</span>
              </div>

              {estimate.profitTrial && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b8a7e]">目标毛利率</span>
                    <span>{estimate.profitTrial.estimatedMarginRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b8a7e]">建议售价</span>
                    <span className="text-emerald-400 font-bold">{estimate.profitTrial.suggestedQuotePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b8a7e]">预估利润</span>
                    <span className={estimate.profitTrial.status === 'positive' ? 'text-emerald-400' : 'text-red-400'}>
                      {estimate.profitTrial.estimatedProfit}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={copyResult}
                className="w-full mt-2 bg-white/[0.06] py-1.5 rounded text-xs text-[#8b8a7e] hover:bg-white/[0.08] active:bg-white/[0.10] transition-colors"
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
        className={`w-full py-3 rounded-xl text-sm font-medium mb-2 transition-colors ${favorited ? 'bg-red-600/15 text-red-400 border border-red-600/20' : 'bg-amber-600 text-white active:bg-amber-700'}`}
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

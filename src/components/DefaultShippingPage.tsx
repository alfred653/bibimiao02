import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { api } from '../lib/api-client'

interface Carrier {
  id: number
  name: string
  firstWeight: number
  firstCost: number
  additionalWeight: number
  additionalCost: number
  volumeDivisor: number
}

interface ShippingDefaults {
  carrierId: number | null
  weight: string
  length: string
  width: string
  height: string
  extraCost: string
  marginRate: string
}

const DEFAULT_VALUES: ShippingDefaults = {
  carrierId: null,
  weight: '1.5',
  length: '',
  width: '',
  height: '',
  extraCost: '0',
  marginRate: '30',
}

function loadDefaults(): ShippingDefaults {
  try {
    const stored = JSON.parse(localStorage.getItem('bbm_default_shipping') || '{}')
    return { ...DEFAULT_VALUES, ...stored }
  } catch { return { ...DEFAULT_VALUES } }
}

export default function DefaultShippingPage() {
  const { toast } = useToast()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [form, setForm] = useState<ShippingDefaults>(loadDefaults)

  useEffect(() => {
    api('/api/shipping-carriers')
      .then(r => r.json())
      .then(d => { if (d.success) setCarriers(d.data) })
      .catch(() => {})
  }, [])

  function set(k: keyof ShippingDefaults, v: string | number | null) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function save() {
    localStorage.setItem('bbm_default_shipping', JSON.stringify(form))
    toast('默认物流设置已保存', 'success')
  }

  function reset() {
    setForm({ ...DEFAULT_VALUES })
    localStorage.removeItem('bbm_default_shipping')
    toast('已恢复默认设置', 'info')
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">默认物流设置</h1>
      <p className="text-xs text-[var(--text-secondary)] mb-4">设置后，进入商品详情页时物流参数将自动填充为默认值。</p>

      <div className="space-y-4">
        {/* Carrier */}
        <div className="bg-[var(--bg-card)] rounded-xl p-4">
          <label className="text-sm font-medium block mb-2">默认快递</label>
          <select
            value={form.carrierId ?? ''}
            onChange={e => {
              const id = e.target.value ? parseInt(e.target.value, 10) : null
              set('carrierId', id)
            }}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">不预设（每次手动选择）</option>
            {carriers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {form.carrierId && carriers.find(c => c.id === form.carrierId) && (() => {
            const c = carriers.find(x => x.id === form.carrierId)!
            return (
              <div className="mt-2 text-xs text-[var(--text-secondary)] space-y-0.5">
                <div>首重 {c.firstWeight}kg / {c.firstCost}元，续重 {c.additionalWeight}kg / {c.additionalCost}元，体积除数 {c.volumeDivisor}</div>
              </div>
            )
          })()}
        </div>

        {/* Weight & Dimensions */}
        <div className="bg-[var(--bg-card)] rounded-xl p-4">
          <label className="text-sm font-medium block mb-3">默认商品参数</label>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-12 shrink-0">重量</span>
              <input type="number" step="0.1" min="0" value={form.weight} onChange={e => set('weight', e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]" />
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">kg</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-secondary)] w-12 shrink-0">尺寸</span>
              <input type="number" step="1" min="0" value={form.length} onChange={e => set('length', e.target.value)} placeholder="长"
                className="w-14 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">×</span>
              <input type="number" step="1" min="0" value={form.width} onChange={e => set('width', e.target.value)} placeholder="宽"
                className="w-14 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">×</span>
              <input type="number" step="1" min="0" value={form.height} onChange={e => set('height', e.target.value)} placeholder="高"
                className="w-14 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-1.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">cm</span>
            </div>
          </div>
        </div>

        {/* Profit settings */}
        <div className="bg-[var(--bg-card)] rounded-xl p-4">
          <label className="text-sm font-medium block mb-3">默认利润设置</label>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-12 shrink-0">额外成本</span>
              <input type="number" step="0.01" min="0" value={form.extraCost} onChange={e => set('extraCost', e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]" />
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">元</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-12 shrink-0">利润率</span>
              <input type="number" step="1" min="0" max="100" value={form.marginRate} onChange={e => set('marginRate', e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]" />
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={reset}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] py-2.5 rounded-lg text-sm text-[var(--text-secondary)] active:bg-[var(--bg-hover)] transition-colors">
            恢复默认
          </button>
          <button onClick={save}
            className="flex-1 bg-[var(--brand)] py-2.5 rounded-lg text-sm font-medium active:bg-[var(--brand-hover)] transition-colors">
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}

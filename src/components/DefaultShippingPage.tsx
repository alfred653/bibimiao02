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

const sectionStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: 'var(--border-width) solid var(--border-default)',
  padding: '16px',
  marginBottom: '12px',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: 'var(--border-width) solid var(--border-default)',
  padding: '6px 8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
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
    toast('Shipping defaults saved', 'success')
  }

  function reset() {
    setForm({ ...DEFAULT_VALUES })
    localStorage.removeItem('bbm_default_shipping')
    toast('Defaults restored', 'info')
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '13px', fontWeight: 800 }}>SH</span>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))', marginBottom: '12px' }}>
        Shipping<br />Defaults
      </h1>

      {/* Carrier */}
      <div style={sectionStyle}>
        <label style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Default Carrier</label>
        <select
          value={form.carrierId ?? ''}
          onChange={e => {
            const id = e.target.value ? parseInt(e.target.value, 10) : null
            set('carrierId', id)
          }}
          style={{ width: '100%', ...inputStyle }}
        >
          <option value="">No preset (select manually each time)</option>
          {carriers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {form.carrierId && carriers.find(c => c.id === form.carrierId) && (() => {
          const c = carriers.find(x => x.id === form.carrierId)!
          return (
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              First {c.firstWeight}kg / {c.firstCost}yuan, Additional {c.additionalWeight}kg / {c.additionalCost}yuan, Vol divisor {c.volumeDivisor}
            </div>
          )
        })()}
      </div>

      {/* Weight & Dimensions */}
      <div style={sectionStyle}>
        <label style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Default Product Params</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '48px', flexShrink: 0 }}>Weight</span>
            <input type="number" step="0.1" min="0" value={form.weight} onChange={e => set('weight', e.target.value)}
              style={{ flex: 1, ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>kg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '48px', flexShrink: 0 }}>Dimensions</span>
            <input type="number" step="1" min="0" value={form.length} onChange={e => set('length', e.target.value)} placeholder="L"
              style={{ width: '56px', textAlign: 'center', ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>x</span>
            <input type="number" step="1" min="0" value={form.width} onChange={e => set('width', e.target.value)} placeholder="W"
              style={{ width: '56px', textAlign: 'center', ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>x</span>
            <input type="number" step="1" min="0" value={form.height} onChange={e => set('height', e.target.value)} placeholder="H"
              style={{ width: '56px', textAlign: 'center', ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>cm</span>
          </div>
        </div>
      </div>

      {/* Profit settings */}
      <div style={sectionStyle}>
        <label style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Default Profit Settings</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '48px', flexShrink: 0 }}>Extra Cost</span>
            <input type="number" step="0.01" min="0" value={form.extraCost} onChange={e => set('extraCost', e.target.value)}
              style={{ flex: 1, ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>yuan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '48px', flexShrink: 0 }}>Margin Rate</span>
            <input type="number" step="1" min="0" max="100" value={form.marginRate} onChange={e => set('marginRate', e.target.value)}
              style={{ flex: 1, ...inputStyle }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button onClick={reset}
          style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Reset
        </button>
        <button onClick={save}
          style={{ background: 'var(--bg-active)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-inverse)' }}>
          Save
        </button>
      </div>
    </div>
  )
}

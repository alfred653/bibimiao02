import { useState } from 'react'
import { useToast } from './Toast'

const ALL_CURRENCIES = [
  { code: 'CNY', name: 'Renminbi', symbol: '¥' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
]

interface ExchangeSettings {
  preferredCurrency: string
}

const DEFAULT_SETTINGS: ExchangeSettings = {
  preferredCurrency: '',
}

function load(): ExchangeSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('bbm_exchange_settings') || '{}') }
  } catch { return { ...DEFAULT_SETTINGS } }
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: 'var(--border-width) solid var(--border-default)',
  padding: '16px',
  marginBottom: '12px',
}

export default function ExchangeRatePage() {
  const { toast } = useToast()
  const [form, setForm] = useState<ExchangeSettings>(load)

  function save() {
    localStorage.setItem('bbm_exchange_settings', JSON.stringify(form))
    toast('Exchange settings saved', 'success')
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Compare Tool V.1</span>
        <span style={{ width: '18px', height: '18px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '9px', fontWeight: 800 }}>FX</span>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))', marginBottom: '12px' }}>
        Exchange<br />Rates
      </h1>

      <div style={sectionStyle}>
        <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Preferred Currency</label>
        <p style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Default display currency for product prices</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ALL_CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setForm(prev => ({ ...prev, preferredCurrency: c.code }))}
              style={{
                width: '100%', textAlign: 'left', padding: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 'var(--border-width) solid',
                background: form.preferredCurrency === c.code ? 'var(--bg-active)' : 'var(--bg-input)',
                color: form.preferredCurrency === c.code ? 'var(--text-inverse)' : 'var(--text-primary)',
                borderColor: form.preferredCurrency === c.code ? 'var(--bg-active)' : 'var(--border-default)',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{c.symbol} {c.code}</span>
                <span style={{ fontSize: '9px', marginLeft: '8px', opacity: 0.7 }}>{c.name}</span>
              </div>
              {form.preferredCurrency === c.code && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l3.5 3.5L13 5" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm({ preferredCurrency: '' }); localStorage.removeItem('bbm_exchange_settings'); toast('Preference cleared', 'info') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '12px', fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
        >
          Clear preference (follow product original currency)
        </button>
      </div>

      <div style={sectionStyle}>
        <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Data Source</label>
        <p style={{ fontSize: '9px', color: 'var(--text-secondary)', margin: 0 }}>
          Exchange rates provided by Frankfurter API, based on ECB daily reference rates. Cached for 5 minutes after first query. Falls back to preset rates if API is unavailable (CNY bridge algorithm).
        </p>
      </div>

      <button onClick={save}
        style={{ width: '100%', background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
        Save Settings
      </button>
    </div>
  )
}

import { useState } from 'react'
import { useToast } from './Toast'

const ALL_CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
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
  const [showSourceDetail, setShowSourceDetail] = useState(false)

  function save() {
    localStorage.setItem('bbm_exchange_settings', JSON.stringify(form))
    toast('汇率设置已保存', 'success')
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
        <span style={{ width: '18px', height: '18px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '13px', fontWeight: 800 }}>FX</span>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))', marginBottom: '12px' }}>
        汇率<br />设置
      </h1>

      <div style={sectionStyle}>
        <label style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>默认显示币种</label>
        <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>用于商品价格的默认换算显示</p>
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
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{c.symbol} {c.code}</span>
                <span style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.7 }}>{c.name}</span>
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
          onClick={() => { setForm({ preferredCurrency: '' }); localStorage.removeItem('bbm_exchange_settings'); toast('已清除偏好', 'info') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '12px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
        >
          跟随商品原币种
        </button>
      </div>

      <div style={sectionStyle}>
        <button onClick={() => setShowSourceDetail(v => !v)}
          style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>汇率来源</label>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{showSourceDetail ? '▼' : '▶'}</span>
        </button>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          汇率来自 Frankfurter API（欧洲央行 ECB 参考汇率），每 5 分钟缓存一次。如接口不可用，使用预设汇率作为备用。
        </p>
        {showSourceDetail && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: '1.5' }}>
            API 请求：Frankfurter API (frankfurter.app) → 5 分钟缓存 → 预设汇率回退。预设汇率覆盖 6 种币种（CNY/USD/JPY/EUR/GBP/HKD），采用 CNY 桥梁算法计算所有币种组合。API 数据基于欧洲央行每个工作日发布的参考汇率。
          </p>
        )}
      </div>

      <button onClick={save}
        style={{ width: '100%', background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
        保存设置
      </button>
    </div>
  )
}

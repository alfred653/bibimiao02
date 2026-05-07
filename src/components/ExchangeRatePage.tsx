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

export default function ExchangeRatePage() {
  const { toast } = useToast()
  const [form, setForm] = useState<ExchangeSettings>(load)

  function save() {
    localStorage.setItem('bbm_exchange_settings', JSON.stringify(form))
    toast('汇率设置已保存', 'success')
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">汇率设置</h1>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        设置后，进入商品详情页时将自动切换到您偏好的币种查看价格。汇率数据来自 Frankfurter 开放 API，每小时更新。
      </p>

      <div className="space-y-4">
        <div className="bg-[var(--bg-card)] rounded-xl p-4">
          <label className="text-sm font-medium block mb-3">偏好币种</label>
          <p className="text-xs text-[var(--text-muted)] mb-3">查看商品价格时默认显示为哪种货币</p>
          <div className="space-y-2">
            {ALL_CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setForm(prev => ({ ...prev, preferredCurrency: c.code }))}
                className="w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between"
                style={{
                  background: form.preferredCurrency === c.code ? 'var(--brand-soft)' : 'var(--bg-input)',
                  borderColor: form.preferredCurrency === c.code ? 'var(--brand)' : 'var(--border-subtle)',
                }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.symbol} {c.code}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                </div>
                {form.preferredCurrency === c.code && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setForm({ preferredCurrency: '' }); localStorage.removeItem('bbm_exchange_settings'); toast('已清除偏好币种', 'info') }}
            className="mt-3 text-xs text-[var(--text-muted)] active:text-[var(--text-secondary)]"
          >
            清除偏好（默认跟随商品原币种）
          </button>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl p-4">
          <label className="text-sm font-medium block mb-3">数据来源</label>
          <p className="text-xs text-[var(--text-secondary)]">
            汇率数据由 Frankfurter API 提供，基于欧洲央行每日参考汇率。首次查询后缓存 5 分钟，如 API 不可用则使用预设汇率（CNY 桥梁算法）。
          </p>
        </div>

        <button onClick={save}
          className="w-full bg-[var(--brand)] py-3 rounded-lg text-sm font-medium active:bg-[var(--brand-hover)] transition-colors">
          保存设置
        </button>
      </div>
    </div>
  )
}

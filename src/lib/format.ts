export function stripBrandPrefix(title: string, brand: string): string {
  if (!brand || !title) return title
  const lower = title.toLowerCase()
  const prefix = brand.toLowerCase()
  if (lower.startsWith(prefix)) {
    const rest = title.slice(brand.length)
    return rest.replace(/^[-_\s]+/, '') || title
  }
  return title
}

const SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
  HKD: 'HK$',
}

export function formatPrice(currency: string | undefined | null, price: string | number | undefined | null): string {
  if (currency == null || price == null || price === '') return '—'
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '—'
  const sym = SYMBOLS[currency] || currency
  if (currency === 'JPY') return `${sym}${Math.round(num).toLocaleString()}`
  return `${sym}${num.toFixed(2)}`
}

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

/** Generate a brand-monogram placeholder URL. Uses neutral grays that work on both themes. */
export function getPlaceholderUrl(brand: string, width: number, height: number): string {
  const letter = (brand || '?').slice(0, 4).toUpperCase()
  return `https://placehold.co/${width}x${height}/C9C9BD/5C5D55?text=${encodeURIComponent(letter)}`
}

export function formatPrice(currency: string | undefined | null, price: string | number | undefined | null): string {
  if (currency == null || price == null || price === '') return '—'
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '—'
  const sym = SYMBOLS[currency] || currency
  if (currency === 'JPY') return `${sym}${Math.round(num).toLocaleString()}`
  return `${sym}${num.toFixed(2)}`
}

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

/** Generate an inline SVG placeholder — gray background + box icon + "暂无图片" text (text hidden at small sizes). */
export function getPlaceholderUrl(_brand: string, width: number, height: number): string {
  const cx = width / 2
  const cy = height / 2
  const scale = Math.min(width / 72, height / 92, 1)
  const showText = width >= 60 && height >= 60
  const sw = 24 * scale
  const sh = 18 * scale
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#d4d4cc"/>
<g transform="translate(${cx.toFixed(1)}, ${(cy - (showText ? 6 : 0)).toFixed(1)})">
<rect x="${(-sw).toFixed(1)}" y="${(-sh).toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" rx="2" fill="none" stroke="#8b8b82" stroke-width="${(1.5 * scale).toFixed(1)}"/>
<path d="M${(-sw).toFixed(1)} ${(-sh).toFixed(1)} L0 ${(-sh * 0.2).toFixed(1)} L${sw.toFixed(1)} ${(-sh).toFixed(1)}" fill="none" stroke="#8b8b82" stroke-width="${(1.5 * scale).toFixed(1)}"/>
<line x1="0" y1="${(-sh * 0.2).toFixed(1)}" x2="0" y2="${sh.toFixed(1)}" stroke="#8b8b82" stroke-width="${(1.5 * scale).toFixed(1)}"/>
</g>
${showText ? `<text x="${cx.toFixed(1)}" y="${(cy + sh + 16).toFixed(1)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${(10 * scale).toFixed(0)}" fill="#8b8b82">暂无图片</text>` : ''}
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function formatPrice(currency: string | undefined | null, price: string | number | undefined | null): string {
  if (currency == null || price == null || price === '') return '—'
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '—'
  const sym = SYMBOLS[currency] || currency
  if (currency === 'JPY') return `${sym}${Math.round(num).toLocaleString()}`
  return `${sym}${num.toFixed(2)}`
}

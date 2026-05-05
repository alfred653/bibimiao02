export const BRANDS = [
  'Osprey', 'Gregory', 'Mystery Ranch',
  'The North Face', 'Stussy', 'Vivienne Westwood',
] as const;
export type Brand = (typeof BRANDS)[number];

export const CURRENCIES = ['CNY', 'USD', 'JPY', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SEARCH_ALIAS_MAP: Record<string, string> = {
  vw: 'Vivienne Westwood',
  tnf: 'The North Face',
  mr: 'Mystery Ranch',
  西太后: 'Vivienne Westwood',
  北面: 'The North Face',
  神秘农场: 'Mystery Ranch',
  北脸: 'The North Face',
};

export const SHIPPING_PROFILES = {
  standard:  { firstWeight: 0.5, firstCost: 32, additionalWeight: 0.5, additionalCost: 10, volumeDivisor: 6000 },
  sensitive: { firstWeight: 0.5, firstCost: 42, additionalWeight: 0.5, additionalCost: 12, volumeDivisor: 6000 },
  large:     { firstWeight: 1.0, firstCost: 58, additionalWeight: 0.5, additionalCost: 11, volumeDivisor: 5000 },
} as const;
export type ShippingMode = keyof typeof SHIPPING_PROFILES;

export const FALLBACK_RATES: Record<string, number> = {
  USD_CNY: 7.23, JPY_CNY: 0.048, EUR_CNY: 7.85, GBP_CNY: 9.15, CNY_CNY: 1,
};

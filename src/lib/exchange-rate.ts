const cache = new Map<string, { rate: number; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes
const FRANKFURTER_URL = 'https://api.frankfurter.dev/latest';

import { FALLBACK_RATES } from './constants';

interface RateResult {
  from: string;
  to: string;
  rate: number;
  source: 'frankfurter' | 'cache' | 'fallback';
  updatedAt: string;
}

export async function getRate(from: string, to: string): Promise<RateResult> {
  const key = `${from}_${to}`;
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.ts < TTL) {
    return {
      from,
      to,
      rate: cached.rate,
      source: 'cache',
      updatedAt: new Date(cached.ts).toISOString(),
    };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(`${FRANKFURTER_URL}?from=${from}&to=${to}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`Frankfurter returned ${resp.status}`);
    const data = await resp.json() as { rates: Record<string, number> };
    const rate = data.rates[to];
    if (!rate) throw new Error(`Rate ${key} not found`);

    cache.set(key, { rate, ts: now });
    return { from, to, rate, source: 'frankfurter', updatedAt: new Date().toISOString() };
  } catch {
    const rate = resolveFallback(from, to);
    if (rate !== null) {
      cache.set(key, { rate, ts: now });
      return { from, to, rate, source: 'fallback', updatedAt: new Date().toISOString() };
    }
    throw new Error(`Unable to get exchange rate for ${key}`);
  }
}

export function resolveFallback(from: string, to: string): number | null {
  if (from === to) return 1;
  const direct = FALLBACK_RATES[`${from}_${to}`];
  if (direct) return direct;
  const inverse = FALLBACK_RATES[`${to}_${from}`];
  if (inverse) return Math.round((1 / inverse) * 10000) / 10000;
  // Bridge via CNY
  if (from !== 'CNY' && to !== 'CNY') {
    const fromCny = resolveFallback(from, 'CNY');
    const cnyTo = resolveFallback('CNY', to);
    if (fromCny !== null && cnyTo !== null) {
      return Math.round(fromCny * cnyTo * 10000) / 10000;
    }
  }
  return null;
}

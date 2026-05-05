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
    const resp = await fetch(`${FRANKFURTER_URL}?from=${from}&to=${to}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) throw new Error(`Frankfurter returned ${resp.status}`);
    const data = await resp.json() as { rates: Record<string, number> };
    const rate = data.rates[to];
    if (!rate) throw new Error(`Rate ${key} not found`);

    cache.set(key, { rate, ts: now });
    return { from, to, rate, source: 'frankfurter', updatedAt: new Date().toISOString() };
  } catch {
    const fallback = FALLBACK_RATES[key];
    if (fallback) {
      return { from, to, rate: fallback, source: 'fallback', updatedAt: new Date().toISOString() };
    }
    throw new Error(`Unable to get exchange rate for ${key}`);
  }
}

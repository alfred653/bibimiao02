import { success, error } from '../lib/response';
import { requireAuth } from '../lib/auth';
import { getRate, resolveFallback } from '../lib/exchange-rate';
import { SHIPPING_PROFILES } from '../lib/constants';

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const price = parseFloat(body.price);
    if (isNaN(price)) return error('price 无效', 400);

    const currency = body.currency?.toUpperCase() || 'CNY';
    const targetCurrency = body.targetCurrency?.toUpperCase() || 'CNY';

    // Exchange rate
    let rate = parseFloat(body.rate);
    let rateSource = 'manual';
    if (isNaN(rate) && currency !== targetCurrency) {
      try {
        const result = await getRate(currency, targetCurrency);
        rate = result.rate;
        rateSource = result.source;
      } catch {
        // Fallback via constants: direct → inverse → bridge CNY
        const fb = resolveFallback(currency, targetCurrency);
        if (fb !== null) {
          rate = fb;
          rateSource = 'fallback';
        } else {
          return error('无法获取汇率', 500);
        }
      }
    } else if (currency === targetCurrency) {
      rate = 1;
    }

    const convertedPrice = price * rate;

    // Shipping estimate
    let shippingCost = 0;
    let shippingLabel = '';
    const shipping = body.shipping;
    if (shipping?.mode && shipping.mode !== 'manual') {
      const profile = SHIPPING_PROFILES[shipping.mode as keyof typeof SHIPPING_PROFILES];
      const custom = shipping.mode === 'custom'
        ? {
            firstWeight: parseFloat(shipping.firstWeight) || 0.5,
            firstCost: parseFloat(shipping.firstCost) || 32,
            additionalWeight: parseFloat(shipping.additionalWeight) || 0.5,
            additionalCost: parseFloat(shipping.additionalCost) || 10,
            volumeDivisor: parseFloat(shipping.volumeDivisor) || 6000,
          }
        : null;

      const p = custom || profile;
      if (p) {
        const weight = parseFloat(shipping.weight) || 0;
        const l = parseFloat(shipping.length) || 0;
        const w = parseFloat(shipping.width) || 0;
        const h = parseFloat(shipping.height) || 0;
        const volumetricWeight = (l * w * h) / p.volumeDivisor;
        const billableWeight = Math.max(weight, volumetricWeight);
        const labelParts = [
          custom ? '自定义' : shipping.mode === 'standard' ? '普通线' : shipping.mode === 'sensitive' ? '特货线' : '大货线',
          `首重${p.firstWeight}kg ¥${p.firstCost}`,
        ];
        if (billableWeight <= p.firstWeight) {
          shippingCost = p.firstCost;
        } else {
          const extra = Math.ceil((billableWeight - p.firstWeight) / p.additionalWeight);
          shippingCost = p.firstCost + extra * p.additionalCost;
          labelParts.push(`续重${extra}×${p.additionalWeight}kg ¥${extra * p.additionalCost}`);
        }
        shippingLabel = labelParts.join(' + ');
      }
    }

    const extraCost = parseFloat(body.extraCost) || 0;
    const estimatedCost = convertedPrice + shippingCost + extraCost;

    // Profit trial
    const targetMarginRate = parseFloat(body.targetMarginRate);
    let profitTrial = undefined;
    if (!isNaN(targetMarginRate) && targetMarginRate > 0 && targetMarginRate < 100) {
      const margin = targetMarginRate / 100;
      const suggestedQuotePrice = estimatedCost / (1 - margin);
      const estimatedProfit = suggestedQuotePrice - estimatedCost;
      profitTrial = {
        suggestedQuotePrice: `¥${suggestedQuotePrice.toFixed(2)}`,
        estimatedProfit: `¥${estimatedProfit.toFixed(2)}`,
        estimatedMarginRate: `${targetMarginRate}%`,
        status: estimatedProfit > 0 ? 'positive' : 'negative',
      };
    }

    return success({
      convertedPrice: Math.round(convertedPrice * 100) / 100,
      convertedPriceFormatted: `¥${convertedPrice.toFixed(2)}`,
      shippingEstimate: shipping.mode ? { cost: shippingCost, label: shippingLabel } : undefined,
      extraCost,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      estimatedCostFormatted: `¥${estimatedCost.toFixed(2)}`,
      exchangeRate: { rate, source: rateSource },
      profitTrial,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('POST /api/cost-estimate:', msg);
    return error(`成本估算失败: ${msg}`, 500);
  }
}

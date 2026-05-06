import { success, error } from '../lib/response';
import { requireAuth } from '../lib/auth';
import { getRate } from '../lib/exchange-rate';
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
        // Graceful fallback: try from constants directly
        const { FALLBACK_RATES } = await import('../lib/constants');
        const direct = FALLBACK_RATES[`${currency}_${targetCurrency}`];
        const inverseKey = `${targetCurrency}_${currency}`;
        const inverse = FALLBACK_RATES[inverseKey];
        if (direct) {
          rate = direct;
          rateSource = 'fallback';
        } else if (inverse) {
          rate = Math.round((1 / inverse) * 10000) / 10000;
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
      if (profile) {
        const weight = parseFloat(shipping.weight) || 0;
        const l = parseFloat(shipping.length) || 0;
        const w = parseFloat(shipping.width) || 0;
        const h = parseFloat(shipping.height) || 0;
        const volumetricWeight = (l * w * h) / profile.volumeDivisor;
        const billableWeight = Math.max(weight, volumetricWeight);
        const labelParts = [
          `${shipping.mode === 'standard' ? '普通线' : shipping.mode === 'sensitive' ? '特货线' : '大货线'}`,
          `首重${profile.firstWeight}kg ¥${profile.firstCost}`,
        ];
        if (billableWeight <= profile.firstWeight) {
          shippingCost = profile.firstCost;
        } else {
          const extra = Math.ceil((billableWeight - profile.firstWeight) / profile.additionalWeight);
          shippingCost = profile.firstCost + extra * profile.additionalCost;
          labelParts.push(`续重${extra}×${profile.additionalWeight}kg ¥${extra * profile.additionalCost}`);
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
    console.error('POST /api/cost-estimate:', e);
    return error('成本估算失败', 500);
  }
}

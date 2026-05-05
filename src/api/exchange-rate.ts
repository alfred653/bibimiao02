import { success, error } from '../lib/response';
import { getRate } from '../lib/exchange-rate';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from')?.toUpperCase();
    const to = url.searchParams.get('to')?.toUpperCase();

    if (!from || !to) return error('请提供 from 和 to 参数', 400);

    const result = await getRate(from, to);
    return success(result);
  } catch (e) {
    console.error('GET /api/exchange-rate:', e);
    return error('获取汇率失败', 500);
  }
}

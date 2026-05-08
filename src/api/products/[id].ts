import { db } from '../../lib/db';
import { products, browseHistory } from '../../db/schema';
import { success, error } from '../../lib/response';
import { getUserId } from '../../lib/auth';
import { getRate } from '../../lib/exchange-rate';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req).catch(() => null);

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const idStr = segments[segments.length - 1];
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return error('无效的商品 ID', 400);

    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return error('商品不存在', 404);

    // Get exchange rate
    let exchangeRate = null;
    if (product.currency && product.currency !== 'CNY') {
      try {
        exchangeRate = await getRate(product.currency, 'CNY');
      } catch {
        // rate unavailable, continue without it
      }
    }

    // Record browse history (fire-and-forget, auth only)
    if (userId) {
      db.insert(browseHistory)
        .values({ userId, productId: id })
        .then(() => {}, () => {});
    }

    return success({
      ...product,
      exchangeRate,
    });
  } catch (e) {
    console.error('GET /api/products/[id]:', e);
    return error('获取商品详情失败', 500);
  }
}

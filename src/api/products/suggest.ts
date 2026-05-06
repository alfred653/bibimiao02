import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { success, error } from '../../lib/response';
import { ilike, eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return error('q 不能为空', 400);
    const limit = Math.min(10, Math.max(1, parseInt(url.searchParams.get('limit') || '5')));

    const rows = await db
      .select({ id: products.id, title: products.title, brand: products.brand })
      .from(products)
      .where(and(eq(products.status, 'active'), ilike(products.title, `%${q}%`)))
      .limit(limit);

    return success(rows);
  } catch (e) {
    console.error('GET /api/products/suggest:', e);
    return error('获取建议失败', 500);
  }
}

import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { success, error } from '../../lib/response';
import { count, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [result] = await db.select({ total: count() }).from(products).where(eq(products.status, 'active'));
    const totalProducts = result?.total ?? 0;

    const rows = await db.select({ brand: products.brand }).from(products).where(eq(products.status, 'active'));
    const brandMap = new Map<string, number>();
    for (const row of rows) {
      brandMap.set(row.brand, (brandMap.get(row.brand) ?? 0) + 1);
    }

    const brands = [...brandMap.entries()].map(([name, count]) => ({
      name,
      count,
      logo: `/brands/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    }));

    const currencyRows = await db
      .selectDistinct({ currency: products.currency })
      .from(products)
      .where(eq(products.status, 'active'));
    const currencyCount = currencyRows.filter((r) => r.currency).length;

    const latest = await db
      .select({ updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(products.updatedAt)
      .limit(1);

    return success({
      totalProducts,
      brandCount: brands.length,
      currencyCount,
      brands,
      lastUpdated: latest[0]?.updatedAt ?? null,
    });
  } catch (e) {
    console.error('GET /api/products/overview:', e);
    return error('获取概览失败', 500);
  }
}

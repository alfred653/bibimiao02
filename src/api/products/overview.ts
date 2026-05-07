import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { success, error } from '../../lib/response';
import { count, eq, desc, isNull, or } from 'drizzle-orm';

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

    const sourceRows = await db
      .selectDistinct({ source: products.source })
      .from(products)
      .where(eq(products.status, 'active'));
    const sourceCount = sourceRows.filter((r) => r.source).length;

    const latest = await db
      .select({ updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(desc(products.updatedAt))
      .limit(1);

    const recentProducts = await db
      .select({
        id: products.id,
        title: products.title,
        brand: products.brand,
        price: products.price,
        currency: products.currency,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(desc(products.updatedAt))
      .limit(3);

    const [noImageResult] = await db.select({ total: count() }).from(products).where(
      or(isNull(products.imageUrl), eq(products.imageUrl, ''))
    );
    const [noSourceResult] = await db.select({ total: count() }).from(products).where(
      or(isNull(products.source), eq(products.source, ''))
    );

    return success({
      totalProducts,
      brandCount: brands.length,
      sourceCount,
      noImageCount: noImageResult?.total ?? 0,
      noSourceCount: noSourceResult?.total ?? 0,
      brands,
      lastUpdated: latest[0]?.updatedAt ?? null,
      recentProducts,
    });
  } catch (e) {
    console.error('GET /api/products/overview:', e);
    return error('获取概览失败', 500);
  }
}

import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { getUserId, getBrandLimit } from '../../lib/auth';
import { success, error } from '../../lib/response';
import { and, eq, ilike, or, sql, desc } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = (body.keyword ?? '').trim();
    if (!keyword) return error('keyword 不能为空', 400);

    const brand = body.brand?.trim();
    const category = body.category?.trim();
    const currency = body.currency?.trim();
    const source = body.source?.trim();
    const priceMin = body.priceMin ? parseFloat(body.priceMin) : null;
    const priceMax = body.priceMax ? parseFloat(body.priceMax) : null;
    const sortBy = body.sortBy || 'relevance';
    const sortOrder = body.sortOrder || 'desc';
    const page = Math.max(1, parseInt(body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(body.pageSize) || 30));

    const userId = await getUserId(req);
    const limit = userId ? await getBrandLimit(userId).catch(() => null) : null;

    let rows: any[];

    if (sortBy === 'relevance') {
      // Full-text search with ts_rank scoring via raw SQL for relevance ranking
      const words = keyword.split(/\s+/).filter((w: string) => w.length > 0);
      const tsquery = words.map((w: string) => `${sanitizeTsquery(w)}:*`).join(' & ');
      const chunks = [
        sql`p.status = 'active'`,
        sql`p.search_vector @@ to_tsquery('simple', ${tsquery})`,
      ];
      if (brand) chunks.push(sql`p.brand = ${brand}`);
      if (category) chunks.push(sql`p.category = ${category}`);
      if (currency) chunks.push(sql`p.currency = ${currency}`);
      if (source) chunks.push(sql`p.source = ${source}`);
      if (priceMin != null) chunks.push(sql`p.price::numeric >= ${priceMin}`);
      if (priceMax != null) chunks.push(sql`p.price::numeric <= ${priceMax}`);

      const result = await db.execute(
        sql`SELECT p.*, ts_rank(p.search_vector, to_tsquery('simple', ${tsquery})) AS _rank
          FROM products p
          WHERE ${sql.join(chunks, sql` AND `)}
          ORDER BY _rank DESC`
      );
      rows = result.rows as any[];
    } else {
      // ILIKE for filtering, sort in-memory for price or by DB for newest
      const whereConditions = [eq(products.status, 'active')];

      const words = keyword.split(/\s+/);
      for (const w of words) {
        whereConditions.push(
          or(
            ilike(products.title, `%${w}%`),
            ilike(products.brand, `%${w}%`),
            ilike(products.category, `%${w}%`),
            ilike(products.spec, `%${w}%`),
            ilike(products.source, `%${w}%`),
          )!
        );
      }

      if (brand) whereConditions.push(eq(products.brand, brand));
      if (category) whereConditions.push(eq(products.category, category));
      if (currency) whereConditions.push(eq(products.currency, currency));
      if (source) whereConditions.push(eq(products.source, source));
      if (priceMin != null) whereConditions.push(sql`${products.price}::numeric >= ${priceMin}`);
      if (priceMax != null) whereConditions.push(sql`${products.price}::numeric <= ${priceMax}`);

      const query = db.select().from(products).where(and(...whereConditions));

      if (sortBy === 'newest') {
        query.orderBy(desc(products.createdAt));
      }

      rows = await query;
    }

    // Apply brand-level quotas
    let filtered = rows;
    if (limit && !limit.unlimited) {
      const brandCounts = new Map<string, number>();
      filtered = [];
      for (const row of rows) {
        const current = brandCounts.get(row.brand) ?? 0;
        const maxForBrand = limit.configuredBrands.includes(row.brand)
          ? Infinity
          : limit.quota;
        if (current < maxForBrand) {
          filtered.push(row);
          brandCounts.set(row.brand, current + 1);
        }
      }
    }

    // For anonymous users: max 10 total
    if (!limit) {
      filtered = filtered.slice(0, 10);
    }

    // Sort for price (in-memory)
    if (sortBy === 'price') {
      filtered.sort((a, b) => {
        const pa = parseFloat(a.price as string) || 0;
        const pb = parseFloat(b.price as string) || 0;
        return sortOrder === 'asc' ? pa - pb : pb - pa;
      });
    }

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    // Strip price fields for anonymous users
    const isAnon = !userId;
    const items = paged.map((item) => {
      if (isAnon) {
        const { price, originalPrice, sourceUrl, _rank, ...rest } = item;
        return rest;
      }
      const { _rank, ...clean } = item;
      return clean;
    });

    // Summary
    const allBrands = [...new Set(filtered.map((r) => r.brand))];
    const allSources = [...new Set(filtered.map((r) => r.source).filter(Boolean))];
    const allCurrencies = [...new Set(filtered.map((r) => r.currency).filter(Boolean))];

    return success({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      summary: {
        brands: allBrands,
        sources: allSources,
        currencies: allCurrencies,
        totalResults: total,
        lastUpdated: filtered[0]?.updatedAt ?? null,
      },
      normalizedKeyword: keyword,
    });
  } catch (e) {
    console.error('POST /api/products/search:', e);
    return error('搜索失败', 500);
  }
}

function sanitizeTsquery(w: string): string {
  // Remove characters that break tsquery syntax
  return w.replace(/['"\\&|!:()*<>]/g, '').slice(0, 100);
}

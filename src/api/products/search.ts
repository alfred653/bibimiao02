import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { getUserId, getBrandLimit } from '../../lib/auth';
import { success, error } from '../../lib/response';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = (body.keyword ?? '').trim();
    if (!keyword) return error('keyword 不能为空', 400);

    const brand = body.brand?.trim();
    const category = body.category?.trim();
    const currency = body.currency?.trim();
    const source = body.source?.trim();
    const sortBy = body.sortBy || 'relevance';
    const sortOrder = body.sortOrder || 'desc';
    const page = Math.max(1, parseInt(body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(body.pageSize) || 30));

    const userId = await getUserId(req);
    const limit = userId ? await getBrandLimit(userId).catch(() => null) : null;

    const whereConditions = [eq(products.status, 'active')];

    // ILIKE search across multiple columns
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

    const rows = await db
      .select()
      .from(products)
      .where(and(...whereConditions));

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

    // Sort
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
        const { price, originalPrice, sourceUrl, ...rest } = item;
        return rest;
      }
      return item;
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

import { db } from '../lib/db';
import { favorites, products } from '../db/schema';
import { success, error } from '../lib/response';
import { requireAuth } from '../lib/auth';
import { and, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '') || 1);
    const pageSize = Math.min(50, parseInt(url.searchParams.get('pageSize') || '') || 30);

    const favRows = await db
      .select({
        id: favorites.id,
        productId: favorites.productId,
        createdAt: favorites.createdAt,
      })
      .from(favorites)
      .where(eq(favorites.userId, userIdInner));

    if (favRows.length === 0) {
      return success({ items: [], pagination: { page, pageSize, total: 0, totalPages: 0 } });
    }

    const productIds = favRows.map((r) => r.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const favMap = new Map(favRows.map((r) => [r.productId, r.createdAt]));
    const items = productRows.map((p) => ({
      ...p,
      favoritedAt: favMap.get(p.id) ?? null,
    }));

    const total = items.length;
    const paged = items.slice((page - 1) * pageSize, page * pageSize);
    return success({ items: paged, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (e) {
    console.error('GET /api/favorites:', e);
    return error('获取收藏失败', 500);
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const body = await req.json();
    const productId = parseInt(body.productId);
    if (isNaN(productId)) return error('productId 无效', 400);

    // Check product exists
    const [prod] = await db.select().from(products).where(eq(products.id, productId));
    if (!prod) return error('商品不存在', 404);

    // Upsert
    await db
      .insert(favorites)
      .values({ userId: userIdInner, productId })
      .onConflictDoNothing();

    return success({ favorited: true });
  } catch (e) {
    console.error('POST /api/favorites:', e);
    return error('添加收藏失败', 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const body = await req.json();
    const productIds = body.productIds ?? [body.productId].filter(Boolean);
    if (!productIds.length) return error('productIds 或 productId 无效', 400);

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userIdInner),
          inArray(favorites.productId, productIds.map(Number))
        )
      );

    return success({ removed: productIds.length });
  } catch (e) {
    console.error('DELETE /api/favorites:', e);
    return error('取消收藏失败', 500);
  }
}

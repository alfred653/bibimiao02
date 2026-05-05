import { db } from '../lib/db';
import { browseHistory, searchHistory } from '../db/schema';
import { success, error } from '../lib/response';
import { requireAuth } from '../lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'browse';

    if (type === 'search') {
      const rows = await db
        .select({ id: searchHistory.id, keyword: searchHistory.keyword, searchedAt: searchHistory.searchedAt })
        .from(searchHistory)
        .where(eq(searchHistory.userId, userIdInner))
        .orderBy(desc(searchHistory.searchedAt))
        .limit(50);
      return success({ items: rows, total: rows.length });
    }

    const rows = await db
      .select({ id: browseHistory.id, productId: browseHistory.productId, viewedAt: browseHistory.viewedAt })
      .from(browseHistory)
      .where(eq(browseHistory.userId, userIdInner))
      .orderBy(desc(browseHistory.viewedAt))
      .limit(50);
    return success({ items: rows, total: rows.length });
  } catch (e) {
    console.error('GET /api/history:', e);
    return error('获取历史失败', 500);
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const body = await req.json();
    const type = body.type;

    if (type === 'search') {
      const keyword = body.keyword?.trim();
      if (!keyword) return error('keyword 不能为空', 400);
      await db.insert(searchHistory).values({ userId: userIdInner, keyword });
      return success({ recorded: true });
    }

    if (type === 'browse') {
      const productId = parseInt(body.productId);
      if (isNaN(productId)) return error('productId 无效', 400);
      await db.insert(browseHistory).values({ userId: userIdInner, productId });
      return success({ recorded: true });
    }

    return error('type 参数无效，需为 browse 或 search', 400);
  } catch (e) {
    console.error('POST /api/history:', e);
    return error('记录历史失败', 500);
  }
}

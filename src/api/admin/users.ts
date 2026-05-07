import { db } from '../../lib/db';
import { users, userPermissions } from '../../db/schema';
import { success, error } from '../../lib/response';
import { requireAdmin } from '../../lib/auth';
import { eq, or, ilike, and } from 'drizzle-orm';
import { BRANDS } from '../../lib/constants';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim();
    const tier = url.searchParams.get('tier');
    const status = url.searchParams.get('status');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '') || 1);
    const pageSize = 30;

    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))!
      );
    }
    if (tier) conditions.push(eq(users.membershipTier, tier));
    if (status) conditions.push(eq(users.status, status));

    const allRows = conditions.length > 0
      ? await db.select().from(users).where(and(...conditions))
      : await db.select().from(users);

    // Fetch permissions for all users
    const allUserIds = allRows.map((u) => u.id);
    const perms = allUserIds.length > 0
      ? await db.select().from(userPermissions).where(
          or(...allUserIds.map((uid) => eq(userPermissions.userId, uid)))
        )
      : [];
    const permMap = new Map<string, string[]>();
    for (const p of perms) {
      const list = permMap.get(p.userId) || [];
      list.push(p.brand);
      permMap.set(p.userId, list);
    }

    const enriched = allRows.map((u) => ({
      ...u,
      configuredBrands: permMap.get(u.id) || [],
    }));

    const total = enriched.length;
    const paged = enriched.slice((page - 1) * pageSize, page * pageSize);

    return success({ items: paged, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (e) {
    console.error('GET /api/admin/users:', e);
    return error('获取用户列表失败', 500);
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const { userId, membershipTier, status: userStatus, brands } = body;
    if (!userId) return error('userId 不能为空', 400);

    // Validate
    if (membershipTier && !['free', 'monthly', 'annual'].includes(membershipTier)) {
      return error('无效的 membershipTier', 400);
    }
    if (brands && !Array.isArray(brands)) return error('brands 必须是数组', 400);
    if (brands) {
      const invalid = brands.filter((b: string) => !BRANDS.includes(b as typeof BRANDS[number]));
      if (invalid.length) return error(`无效品牌: ${invalid.join(', ')}`, 400);
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (membershipTier) updates.membershipTier = membershipTier;
    if (userStatus) updates.status = userStatus;

    await db.update(users).set(updates).where(eq(users.id, userId));

    // Update brand permissions
    if (brands !== undefined) {
      await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
      if (brands.length > 0) {
        await db.insert(userPermissions).values(
          brands.map((b: string) => ({ userId, brand: b }))
        );
      }
    }

    return success({ updated: true });
  } catch (e) {
    console.error('PUT /api/admin/users:', e);
    return error('更新用户失败', 500);
  }
}

import { db } from '../lib/db';
import { users, userPermissions } from '../db/schema';
import { success, error } from '../lib/response';
import { requireAuth } from '../lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const [user] = await db.select().from(users).where(eq(users.id, userIdInner));
    if (!user) return error('用户不存在', 404);

    const perms = await db
      .select({ brand: userPermissions.brand })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userIdInner));
    const configuredBrands = perms.map((p) => p.brand);

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      membershipTier: user.membershipTier,
      role: user.role,
      status: user.status,
      configuredBrands,
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error('GET /api/profile:', e);
    return error('获取资料失败', 500);
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (typeof authResult !== 'string') return authResult;
    const userIdInner = authResult;

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (Object.keys(updates).length === 0) return error('无可更新的字段', 400);

    updates.updatedAt = new Date();
    await db.update(users).set(updates).where(eq(users.id, userIdInner));

    const [updated] = await db.select().from(users).where(eq(users.id, userIdInner));
    return success(updated!);
  } catch (e) {
    console.error('PUT /api/profile:', e);
    return error('更新资料失败', 500);
  }
}

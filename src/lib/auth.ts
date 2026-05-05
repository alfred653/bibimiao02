import * as jose from 'jose';
import { db } from './db';
import { users, userPermissions } from '../db/schema';
import { eq } from 'drizzle-orm';

const CLERK_JWKS_URL = 'https://api.clerk.com/v1/jwks';
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour
let jwksCache: { keys: jose.JSONWebKeySet; ts: number } | null = null;

async function getJWKS() {
  if (jwksCache && Date.now() - jwksCache.ts < JWKS_CACHE_TTL) {
    return jwksCache.keys;
  }
  const resp = await fetch(CLERK_JWKS_URL);
  const keys = await resp.json() as jose.JSONWebKeySet;
  jwksCache = { keys, ts: Date.now() };
  return keys;
}

// 从请求中提取并验证用户 ID，未登录返回 null
export async function getUserId(req: Request): Promise<string | null> {
  // Dev mode bypass: X-Dev-User-Id header 模拟登录（仅本地/非生产）
  if (process.env.NODE_ENV !== 'production') {
    const devUser = req.headers.get('X-Dev-User-Id');
    if (devUser) return devUser;
  }

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const jwks = await getJWKS();
    const { payload } = await jose.jwtVerify(token, jose.createLocalJWKSet(jwks), {
      algorithms: ['RS256'],
    });
    // Validate issuer: must be Clerk (clerk.<domain>.accounts.dev)
    const iss = payload.iss;
    if (!iss || !/^https:\/\/clerk\..+\.accounts\.dev$/.test(iss)) return null;
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

// 获取用户品牌限额
export interface BrandLimit {
  unlimited: boolean;
  configuredBrands: string[];
  quota: number;
}

export async function getBrandLimit(userId: string): Promise<BrandLimit> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.status !== 'active') {
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    return { unlimited: true, configuredBrands: [], quota: Infinity };
  }

  const perms = await db
    .select()
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));
  const configuredBrands = perms.map((p) => p.brand);

  if (user.membershipTier === 'free') {
    return { unlimited: false, configuredBrands: [], quota: 10 };
  }

  return { unlimited: false, configuredBrands, quota: 30 };
}

// 确认用户已登录，未登录返回 401 Response
export async function requireAuth(req: Request): Promise<string | Response> {
  const userId = await getUserId(req);
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: { message: '请先登录', code: 401 } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return userId;
}

// 确认用户是管理员
export async function requireAdmin(req: Request): Promise<string | Response> {
  const authResult = await requireAuth(req);
  if (typeof authResult !== 'string') return authResult;
  const userId = authResult;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: { message: '需要管理员权限', code: 403 } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return userId;
}

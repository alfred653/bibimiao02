import { db } from '../../lib/db';
import { shippingCarriers } from '../../db/schema';
import { success, error } from '../../lib/response';
import { requireAdmin } from '../../lib/auth';
import { eq } from 'drizzle-orm';

type ParseResult =
  | { ok: false; error: string }
  | { ok: true; name: string; firstWeight: string; firstCost: string; additionalWeight: string; additionalCost: string; volumeDivisor: number; isActive: string };

function parseBody(body: Record<string, unknown>): ParseResult {
  const name = String(body.name || '').trim();
  if (!name) return { ok: false, error: '快递名称不能为空' };

  const firstWeight = parseFloat(String(body.firstWeight));
  if (isNaN(firstWeight) || !isFinite(firstWeight) || firstWeight <= 0) return { ok: false, error: '首重必须 > 0' };

  const firstCost = parseFloat(String(body.firstCost));
  if (isNaN(firstCost) || !isFinite(firstCost) || firstCost <= 0) return { ok: false, error: '首重价格必须 > 0' };

  const additionalWeight = parseFloat(String(body.additionalWeight));
  if (isNaN(additionalWeight) || !isFinite(additionalWeight) || additionalWeight <= 0) return { ok: false, error: '续重单位必须 > 0' };

  const additionalCost = parseFloat(String(body.additionalCost));
  if (isNaN(additionalCost) || !isFinite(additionalCost) || additionalCost <= 0) return { ok: false, error: '续重价格必须 > 0' };

  const volumeDivisor = parseInt(String(body.volumeDivisor), 10);
  if (isNaN(volumeDivisor) || volumeDivisor < 1000) return { ok: false, error: '体积除数必须 ≥ 1000' };

  const isActive = body.isActive === 'inactive' ? 'inactive' : 'active';

  return {
    ok: true,
    name,
    firstWeight: String(firstWeight),
    firstCost: String(firstCost),
    additionalWeight: String(additionalWeight),
    additionalCost: String(additionalCost),
    volumeDivisor,
    isActive,
  };
}

// GET /api/admin/shipping-carriers — 所有快递（含未启用）
export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const rows = await db.select().from(shippingCarriers).orderBy(shippingCarriers.id);
    const carriers = rows.map(r => ({
      ...r,
      firstWeight: Number(r.firstWeight),
      firstCost: Number(r.firstCost),
      additionalWeight: Number(r.additionalWeight),
      additionalCost: Number(r.additionalCost),
    }));
    return success(carriers);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`获取快递列表失败: ${msg}`, 500);
  }
}

// POST /api/admin/shipping-carriers — 新增快递
export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const parsed = parseBody(body);
    if (!parsed.ok) return error(parsed.error, 400);
    const { ok: _, ...values } = parsed;

    const [row] = await db.insert(shippingCarriers).values(values).returning();
    return success({
      ...row,
      firstWeight: Number(row.firstWeight),
      firstCost: Number(row.firstCost),
      additionalWeight: Number(row.additionalWeight),
      additionalCost: Number(row.additionalCost),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`新增快递失败: ${msg}`, 500);
  }
}

// PUT /api/admin/shipping-carriers — 编辑快递
export async function PUT(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const id = parseInt(String(body.id), 10);
    if (isNaN(id)) return error('id 无效', 400);

    const parsed = parseBody(body);
    if (!parsed.ok) return error(parsed.error, 400);
    const { ok: _, ...values } = parsed;

    const [row] = await db.update(shippingCarriers).set({ ...values, updatedAt: new Date() }).where(eq(shippingCarriers.id, id)).returning();
    if (!row) return error('快递不存在', 404);
    return success({
      ...row,
      firstWeight: Number(row.firstWeight),
      firstCost: Number(row.firstCost),
      additionalWeight: Number(row.additionalWeight),
      additionalCost: Number(row.additionalCost),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`编辑快递失败: ${msg}`, 500);
  }
}

// DELETE /api/admin/shipping-carriers — 删除快递
export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const { id } = await req.json();
    const n = parseInt(String(id), 10);
    if (isNaN(n)) return error('id 无效', 400);

    await db.delete(shippingCarriers).where(eq(shippingCarriers.id, n));
    return success({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`删除快递失败: ${msg}`, 500);
  }
}

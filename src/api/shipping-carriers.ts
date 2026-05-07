import { db } from '../lib/db';
import { shippingCarriers } from '../db/schema';
import { success, error } from '../lib/response';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === '1';
    const rows = all
      ? await db.select().from(shippingCarriers).orderBy(shippingCarriers.id)
      : await db.select().from(shippingCarriers).where(eq(shippingCarriers.isActive, 'active')).orderBy(shippingCarriers.id);
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

import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { success, error } from '../../lib/response';
import { requireAdmin } from '../../lib/auth';
import { and, eq, ilike, or, inArray, isNull } from 'drizzle-orm';

const VALID_STATUSES = ['active', 'inactive'];
const MAX_IMPORT_ROWS = 1000;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 20;

function sanitizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .filter(t => t != null)
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS)
      .map(t => t.slice(0, MAX_TAG_LENGTH));
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS)
      .map(t => t.slice(0, MAX_TAG_LENGTH));
  }
  return [];
}

function sanitizePrice(raw: unknown): string | null {
  if (raw == null) return null;
  const t = typeof raw;
  if (t === 'string' || t === 'number') return String(raw);
  return null;
}

function sanitizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith('https://') || s.startsWith('http://')) return s;
  return null;
}

function sanitizeStatus(raw: unknown): string {
  if (typeof raw === 'string' && VALID_STATUSES.includes(raw)) return raw;
  return 'active';
}

function mapDbError(e: unknown): string {
  const msg = (e as any)?.message || '';
  if (msg.includes('not-null') || msg.includes('violates not-null')) return '必填字段缺失';
  if (msg.includes('unique constraint') || msg.includes('duplicate key')) return '数据重复';
  if (msg.includes('foreign key') || msg.includes('violates foreign key')) return '关联数据不存在';
  return '数据格式错误';
}

export interface NormalizedRow {
  title: string;
  brand: string;
  category: string | null;
  spec: string | null;
  price: string | null;
  originalPrice: string | null;
  currency: string;
  source: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  country: string | null;
  tags: string[];
  status: string;
}

export function normalizeRow(row: Record<string, unknown>): NormalizedRow {
  const price = sanitizePrice(row.price);
  const originalPrice = sanitizePrice(row.originalPrice) ?? price;

  return {
    title: String(row.title ?? ''),
    brand: String(row.brand ?? ''),
    category: typeof row.category === 'string' && row.category ? row.category : null,
    spec: typeof row.spec === 'string' && row.spec ? row.spec : null,
    price,
    originalPrice,
    currency: typeof row.currency === 'string' && row.currency ? row.currency : 'CNY',
    source: typeof row.source === 'string' && row.source ? row.source : null,
    sourceUrl: sanitizeUrl(row.sourceUrl),
    imageUrl: sanitizeUrl(row.imageUrl),
    country: typeof row.country === 'string' && row.country ? row.country : null,
    tags: sanitizeTags(row.tags),
    status: sanitizeStatus(row.status),
  };
}

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const url = new URL(req.url);
    const brand = url.searchParams.get('brand')?.trim();
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.trim();
    const missingImage = url.searchParams.get('missingImage') === '1';
    const missingSource = url.searchParams.get('missingSource') === '1';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '') || 1);
    const pageSize = 30;

    const conditions = [];
    if (brand) conditions.push(eq(products.brand, brand));
    if (status) conditions.push(eq(products.status, status));
    if (search) {
      conditions.push(
        or(ilike(products.title, `%${search}%`), ilike(products.brand, `%${search}%`))!
      );
    }
    if (missingImage) conditions.push(or(isNull(products.imageUrl), eq(products.imageUrl, ''))!);
    if (missingSource) conditions.push(or(isNull(products.source), eq(products.source, ''))!);

    const allRows = conditions.length > 0
      ? await db.select().from(products).where(and(...conditions))
      : await db.select().from(products);

    const total = allRows.length;
    const paged = allRows.slice((page - 1) * pageSize, page * pageSize);

    return success({ items: paged, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (e) {
    console.error('GET /api/admin/products:', e);
    return error('获取商品列表失败', 500);
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();

    if (body.import === 'confirm') {
      if (!Array.isArray(body.rows) || body.rows.length === 0) {
        return error('rows 不能为空', 400);
      }
      if (body.rows.length > MAX_IMPORT_ROWS) {
        return error(`单次导入不能超过 ${MAX_IMPORT_ROWS} 条`, 400);
      }

      const processed: NormalizedRow[] = [];
      const failures: { row: number; reason: string }[] = [];

      for (let i = 0; i < body.rows.length; i++) {
        const row = normalizeRow(body.rows[i]);
        if (!row.title || !row.brand) {
          failures.push({ row: i + 1, reason: 'title 和 brand 为必填' });
          continue;
        }
        processed.push(row);
      }

      // Deduplicate: query all existing title+brand pairs in one shot
      const pairs = [...new Set(processed.map(r => `${r.title}|||${r.brand}`))].map(s => {
        const [title, brand] = s.split('|||');
        return { title, brand };
      });

      const existingSet = new Set<string>();
      if (pairs.length > 0) {
        const existing = await db.select({ title: products.title, brand: products.brand })
          .from(products)
          .where(
            or(...pairs.map(p => and(eq(products.title, p.title), eq(products.brand, p.brand))!))
          );
        for (const e of existing) {
          existingSet.add(`${e.title}|||${e.brand}`);
        }
      }

      const imported: unknown[] = [];
      const skipped: { row: number; reason: string }[] = [];

      for (let i = 0; i < processed.length; i++) {
        const key = `${processed[i].title}|||${processed[i].brand}`;
        if (existingSet.has(key)) {
          skipped.push({ row: i + 1, reason: `"${processed[i].title}" (${processed[i].brand}) 已存在，跳过` });
          continue;
        }
        try {
          const [row] = await db.insert(products).values(processed[i]).returning();
          imported.push(row);
          existingSet.add(key);
        } catch (e) {
          failures.push({ row: i + 1, reason: mapDbError(e) });
        }
      }

      return success({ imported: imported.length, skippedCount: skipped.length, total: body.rows.length, failures, skipped });
    }

    // Single product — check duplicate
    const row = normalizeRow(body);
    if (!row.title || !row.brand) {
      return error('title 和 brand 为必填', 400);
    }

    const [dup] = await db.select({ id: products.id })
      .from(products)
      .where(and(eq(products.title, row.title), eq(products.brand, row.brand)))
      .limit(1);
    if (dup) {
      return error(`"${row.title}" (${row.brand}) 已存在`, 409);
    }

    const [inserted] = await db.insert(products).values(row).returning();
    return success(inserted);
  } catch (e) {
    console.error('POST /api/admin/products:', e);
    return error('添加商品失败', 500);
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return error('id 不能为空', 400);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const allowed = ['title', 'brand', 'category', 'spec', 'price', 'originalPrice', 'currency', 'source', 'sourceUrl', 'imageUrl', 'country', 'tags', 'status'];
    for (const key of allowed) {
      if (fields[key] !== undefined) updates[key] = fields[key];
    }

    await db.update(products).set(updates).where(eq(products.id, id));
    return success({ updated: true });
  } catch (e) {
    console.error('PUT /api/admin/products:', e);
    return error('更新商品失败', 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const { id } = body;
    if (!id) return error('id 不能为空', 400);

    await db.delete(products).where(eq(products.id, id));
    return success({ deleted: true });
  } catch (e) {
    console.error('DELETE /api/admin/products:', e);
    return error('删除商品失败', 500);
  }
}

export async function batchDelete(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const ids: number[] = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) return error('ids 不能为空', 400);
    if (ids.length > 200) return error('单次最多删除 200 条', 400);

    await db.delete(products).where(inArray(products.id, ids));
    return success({ deleted: ids.length });
  } catch (e) {
    console.error('POST /api/admin/products/batch-delete:', e);
    return error('批量删除失败', 500);
  }
}

export async function batchUpdate(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const body = await req.json();
    const ids: number[] = body.ids;
    const field = body.field;
    const value = body.value;

    if (!Array.isArray(ids) || ids.length === 0) return error('ids 不能为空', 400);
    if (ids.length > 200) return error('单次最多修改 200 条', 400);
    if (field !== 'status' && field !== 'brand') return error('field 必须为 status 或 brand', 400);
    if (!value || typeof value !== 'string') return error('value 不能为空', 400);
    if (field === 'status' && !['active', 'inactive'].includes(value)) return error('status 值无效', 400);

    await db.update(products).set({ [field]: value, updatedAt: new Date() }).where(inArray(products.id, ids));
    return success({ updated: ids.length });
  } catch (e) {
    console.error('POST /api/admin/products/batch-update:', e);
    return error('批量修改失败', 500);
  }
}

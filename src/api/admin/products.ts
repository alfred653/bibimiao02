import { db } from '../../lib/db';
import { products } from '../../db/schema';
import { success, error } from '../../lib/response';
import { requireAdmin } from '../../lib/auth';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (typeof authResult !== 'string') return authResult;

    const url = new URL(req.url);
    const brand = url.searchParams.get('brand')?.trim();
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.trim();
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
      // Bulk confirm import
      if (!Array.isArray(body.rows) || body.rows.length === 0) {
        return error('rows 不能为空', 400);
      }
      await db.insert(products).values(body.rows);
      return success({ imported: body.rows.length });
    }

    // Single product
    if (!body.title || !body.brand) {
      return error('title 和 brand 为必填', 400);
    }

    const [inserted] = await db.insert(products).values({
      title: body.title,
      brand: body.brand,
      category: body.category ?? null,
      spec: body.spec ?? null,
      price: body.price?.toString() ?? null,
      originalPrice: body.originalPrice?.toString() ?? body.price?.toString() ?? null,
      currency: body.currency ?? 'CNY',
      source: body.source ?? null,
      sourceUrl: body.sourceUrl ?? null,
      imageUrl: body.imageUrl ?? null,
      country: body.country ?? null,
      tags: body.tags ?? [],
      status: body.status ?? 'active',
    }).returning();

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

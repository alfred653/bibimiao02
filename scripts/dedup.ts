// scripts/dedup.ts — remove duplicate products (same title + brand), keep the oldest (lowest id)
// Run with: npx tsx --env-file=.env scripts/dedup.ts
import { db } from '../src/lib/db';
import { products } from '../src/db/schema';
import { eq, and, ne, sql, inArray } from 'drizzle-orm';

const dupes = await db.execute(sql`
  SELECT title, brand, array_agg(id ORDER BY id) AS ids, count(*) AS cnt
  FROM products
  GROUP BY title, brand
  HAVING count(*) > 1
`);

const rows = dupes.rows as { title: string; brand: string; ids: number[]; cnt: number }[];

if (rows.length === 0) {
  console.log('No duplicates found.');
  process.exit(0);
}

let totalDeleted = 0;
for (const r of rows) {
  const [keep, ...remove] = r.ids;
  await db.delete(products).where(inArray(products.id, remove));
  totalDeleted += remove.length;
  console.log(`"${r.title}" (${r.brand}): kept #${keep}, removed ${remove.length} (${remove.map(String).join(', ')})`);
}

console.log(`\nDone. Removed ${totalDeleted} duplicate rows across ${rows.length} title+brand groups.`);
process.exit(0);

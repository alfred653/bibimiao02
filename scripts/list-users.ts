import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../src/db/schema';

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(import.meta.dirname!, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    let val = trimmed.slice(idx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found, rely on system env */ }

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 未设置，请检查 .env.local 文件');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function main() {
  const cmd = process.argv[2];

  if (cmd === 'list') {
    const all = await db.select().from(users);
    console.log(`共 ${all.length} 个用户：`);
    for (const u of all) {
      console.log(`  ${u.id} | ${u.email} | ${u.name} | role=${u.role} | tier=${u.membershipTier} | ${u.status}`);
    }
  } else if (cmd === 'admin') {
    const clerkId = process.argv[3];
    const email = process.argv[4] || null;
    if (!clerkId) { console.log('用法: npx tsx scripts/list-users.ts admin <Clerk-ID> [email]'); process.exit(1); }

    // Upsert: insert if not exists, then update role
    await db.insert(users).values({
      id: clerkId,
      email: email ?? null,
      name: email ?? 'Admin',
      role: 'admin',
      membershipTier: 'lifetime',
    }).onConflictDoUpdate({
      target: [users.id],
      set: { role: 'admin', membershipTier: 'lifetime' },
    });
    console.log(`已将 ${clerkId} 设为管理员`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

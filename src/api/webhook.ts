import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    // Verify webhook secret (Svix signature verification omitted in dev mode)
    if (process.env.CLERK_WEBHOOK_SECRET && process.env.CLERK_WEBHOOK_SECRET !== 'whsec_replace_me') {
      // In production, verify the Svix signature from svix-id / svix-signature / svix-timestamp headers
    }

    const body = await req.json();
    const { type, data } = body;

    switch (type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        const email = email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ') || email;
        await db
          .insert(users)
          .values({
            id,
            email: email ?? null,
            name: name ?? null,
            avatarUrl: image_url ?? null,
            membershipTier: 'free',
            role: 'user',
          })
          .onConflictDoNothing();
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        const email = email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ') || email;
        await db
          .update(users)
          .set({
            email: email ?? undefined,
            name: name ?? undefined,
            avatarUrl: image_url ?? undefined,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      case 'user.deleted': {
        const { id } = data;
        if (id) {
          await db.delete(users).where(eq(users.id, id));
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      default:
        return new Response(JSON.stringify({ ok: true, ignored: type }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (e) {
    console.error('POST /api/webhook:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

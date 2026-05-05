import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

let _db: ReturnType<typeof drizzle> | undefined;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  _db = drizzle(neon(url));
  return _db;
}

// Proxy that lazily initializes and delegates properly
const handler: ProxyHandler<object> = {
  get(_, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
  apply(_, thisArg, args) {
    return Reflect.apply(getDb() as any, thisArg, args);
  },
};

export const db = new Proxy({}, handler) as ReturnType<typeof drizzle>;

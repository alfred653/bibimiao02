import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local before any other modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* .env.local not found */ }

const port = process.env.PORT || 3000;

// Dynamic imports to ensure env vars are loaded first
const { default: express } = await import('express');
const { createServer: createViteServer } = await import('vite');

const app = express();

const ROUTES = [
  { method: 'get',    path: '/api/health',            handler: './src/api/health.ts',              export: 'GET' },
  { method: 'post',   path: '/api/products/search',    handler: './src/api/products/search.ts',     export: 'POST' },
  { method: 'get',    path: '/api/products/overview',  handler: './src/api/products/overview.ts',   export: 'GET' },
  { method: 'get',    path: '/api/products/:id',       handler: './src/api/products/[id].ts',       export: 'GET' },
  { method: 'get',    path: '/api/exchange-rate',      handler: './src/api/exchange-rate.ts',       export: 'GET' },
  { method: 'post',   path: '/api/cost-estimate',      handler: './src/api/cost-estimate.ts',       export: 'POST' },
  { method: 'get',    path: '/api/favorites',          handler: './src/api/favorites.ts',           export: 'GET' },
  { method: 'post',   path: '/api/favorites',          handler: './src/api/favorites.ts',           export: 'POST' },
  { method: 'delete', path: '/api/favorites',          handler: './src/api/favorites.ts',           export: 'DELETE' },
  { method: 'get',    path: '/api/history',            handler: './src/api/history.ts',             export: 'GET' },
  { method: 'post',   path: '/api/history',            handler: './src/api/history.ts',             export: 'POST' },
  { method: 'get',    path: '/api/profile',            handler: './src/api/profile.ts',             export: 'GET' },
  { method: 'put',    path: '/api/profile',            handler: './src/api/profile.ts',             export: 'PUT' },
  { method: 'post',   path: '/api/webhook',            handler: './src/api/webhook.ts',             export: 'POST' },
  { method: 'get',    path: '/api/admin/users',        handler: './src/api/admin/users.ts',         export: 'GET' },
  { method: 'put',    path: '/api/admin/users',        handler: './src/api/admin/users.ts',         export: 'PUT' },
  { method: 'get',    path: '/api/admin/products',     handler: './src/api/admin/products.ts',      export: 'GET' },
  { method: 'post',   path: '/api/admin/products',     handler: './src/api/admin/products.ts',      export: 'POST' },
  { method: 'put',    path: '/api/admin/products',     handler: './src/api/admin/products.ts',      export: 'PUT' },
  { method: 'delete', path: '/api/admin/products',     handler: './src/api/admin/products.ts',      export: 'DELETE' },
];

function buildRequest(expressReq, expressRes) {
  const url = new URL(expressReq.originalUrl, `http://${expressReq.headers.host || 'localhost'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(expressReq.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }
  const init = { method: expressReq.method, headers };
  if (expressReq.method !== 'GET' && expressReq.method !== 'HEAD' && expressReq.body) {
    init.body = typeof expressReq.body === 'string' ? expressReq.body : JSON.stringify(expressReq.body);
  }
  return new Request(url.toString(), init);
}

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(express.json());

  // API routes must be registered BEFORE Vite middleware
  for (const route of ROUTES) {
    try {
      const handlerModule = await vite.ssrLoadModule(route.handler);
      const handlerFn = handlerModule[route.export];
      if (!handlerFn) {
        console.warn(`  WARN: ${route.export} not found in ${route.handler}`);
        continue;
      }
      app[route.method](route.path, async (req, res) => {
        try {
          const webReq = buildRequest(req, res);
          const webRes = await handlerFn(webReq);
          res.status(webRes.status);
          webRes.headers.forEach((v, k) => {
            if (!k.toLowerCase().startsWith('content-encoding')) res.setHeader(k, v);
          });
          const body = await webRes.text();
          res.send(body);
        } catch (e) {
          console.error(`API error [${route.method.toUpperCase()} ${route.path}]:`, e);
          res.status(500).json({ success: false, error: { message: 'Internal Server Error', code: 500 } });
        }
      });
      console.log(`  ${route.method.toUpperCase()} ${route.path}`);
    } catch (err) {
      console.warn(`  SKIP ${route.method.toUpperCase()} ${route.path} — ${err.message}`);
    }
  }

  // Vite SPA middleware last — only handles requests not matched by API routes
  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`\nDev server running at http://localhost:${port}`);
  });
}

start();

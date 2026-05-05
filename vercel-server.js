import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local (local dev only, Vercel uses Dashboard env vars) ───
try {
  const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

// ─── Import all API handlers ───
import * as hHealth from './src/api/health.js';
import * as hSearch from './src/api/products/search.js';
import * as hOverview from './src/api/products/overview.js';
import * as hProductDetail from './src/api/products/[id].js';
import * as hExchangeRate from './src/api/exchange-rate.js';
import * as hCostEstimate from './src/api/cost-estimate.js';
import * as hFavorites from './src/api/favorites.js';
import * as hHistory from './src/api/history.js';
import * as hProfile from './src/api/profile.js';
import * as hWebhook from './src/api/webhook.js';
import * as hAdminUsers from './src/api/admin/users.js';
import * as hAdminProducts from './src/api/admin/products.js';

const ROUTES = [
  ['GET',    '/api/health',            hHealth.GET],
  ['POST',   '/api/products/search',    hSearch.POST],
  ['GET',    '/api/products/overview',  hOverview.GET],
  ['GET',    '/api/products/:id',       hProductDetail.GET],
  ['GET',    '/api/exchange-rate',      hExchangeRate.GET],
  ['POST',   '/api/cost-estimate',      hCostEstimate.POST],
  ['GET',    '/api/favorites',          hFavorites.GET],
  ['POST',   '/api/favorites',          hFavorites.POST],
  ['DELETE', '/api/favorites',          hFavorites.DELETE],
  ['GET',    '/api/history',            hHistory.GET],
  ['POST',   '/api/history',            hHistory.POST],
  ['GET',    '/api/profile',            hProfile.GET],
  ['PUT',    '/api/profile',            hProfile.PUT],
  ['POST',   '/api/webhook',            hWebhook.POST],
  ['GET',    '/api/admin/users',        hAdminUsers.GET],
  ['PUT',    '/api/admin/users',        hAdminUsers.PUT],
  ['GET',    '/api/admin/products',     hAdminProducts.GET],
  ['POST',   '/api/admin/products',     hAdminProducts.POST],
  ['PUT',    '/api/admin/products',     hAdminProducts.PUT],
  ['DELETE', '/api/admin/products',     hAdminProducts.DELETE],
];

function matchRoute(method, path) {
  for (const [m, pattern, handler] of ROUTES) {
    if (m !== method) continue;
    // Convert Express pattern (:param) to regex
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) return { handler, params: match.slice(1) };
  }
  return null;
}

function buildWebRequest(expressReq) {
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

const app = express();
app.use(express.json());

// ─── API middleware ───
app.use('/api/*', async (req, res) => {
  const route = matchRoute(req.method, req.path);
  if (!route) {
    return res.status(404).json({ success: false, error: { message: 'Not found', code: 404 } });
  }
  try {
    const webReq = buildWebRequest(req);
    const webRes = await route.handler(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((v, k) => {
      if (!k.toLowerCase().startsWith('content-encoding')) res.setHeader(k, v);
    });
    res.send(await webRes.text());
  } catch (e) {
    console.error(`API error [${req.method} ${req.path}]:`, e);
    res.status(500).json({ success: false, error: { message: 'Internal Server Error', code: 500 } });
  }
});

// ─── Static files (production only) ───
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// ─── SPA fallback ───
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// ─── Export for Vercel ───
export default app;

// ─── Standalone start (local test) ───
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

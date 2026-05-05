// ─── Import pre-compiled handlers (built by scripts/build-api.js) ───
import {
  healthGet,
  overviewGet,
  searchPost,
  productDetailGet,
  exchangeRateGet,
  costEstimatePost,
  favoritesGet, favoritesPost, favoritesDelete,
  historyGet, historyPost,
  profileGet, profilePut,
  webhookPost,
  adminUsersGet, adminUsersPut,
  adminProductsGet, adminProductsPost, adminProductsPut, adminProductsDelete,
} from '../dist-api/handlers.js';

const ROUTES = {
  'GET /api/health':             healthGet,
  'POST /api/products/search':   searchPost,
  'GET /api/products/overview':  overviewGet,
  'GET /api/products/:id':       productDetailGet,
  'GET /api/exchange-rate':      exchangeRateGet,
  'POST /api/cost-estimate':     costEstimatePost,
  'GET /api/favorites':          favoritesGet,
  'POST /api/favorites':         favoritesPost,
  'DELETE /api/favorites':       favoritesDelete,
  'GET /api/history':            historyGet,
  'POST /api/history':           historyPost,
  'GET /api/profile':            profileGet,
  'PUT /api/profile':            profilePut,
  'POST /api/webhook':           webhookPost,
  'GET /api/admin/users':        adminUsersGet,
  'PUT /api/admin/users':        adminUsersPut,
  'GET /api/admin/products':     adminProductsGet,
  'POST /api/admin/products':    adminProductsPost,
  'PUT /api/admin/products':     adminProductsPut,
  'DELETE /api/admin/products':  adminProductsDelete,
};

function matchHandler(method, path) {
  for (const [key, handler] of Object.entries(ROUTES)) {
    const [m, pattern] = key.split(' ', 2);
    if (m !== method) continue;
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) return { handler, params: match.slice(1) };
  }
  return null;
}

function toWebRequest(req, path) {
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k !== '_path') searchParams.set(k, Array.isArray(v) ? v[0] : String(v));
  }
  const qs = searchParams.toString();
  const url = new URL(
    path + (qs ? '?' + qs : ''),
    `http://${req.headers.host || 'localhost'}`
  );
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value != null) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }
  const init = { method: req.method || 'GET', headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  return new Request(url.toString(), init);
}

let _authDebugOnce = false;

export default async function handler(req, res) {
  const path = req.query?._path || req.url || '/';

  // Debug endpoint
  if (path === '/api/debug') {
    return res.status(200).json({
      success: true,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasClerkKey: !!process.env.CLERK_PUBLISHABLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
      path,
    });
  }

  // Auth debug: test JWT verification step by step
  if (path === '/api/auth-debug') {
    _authDebugOnce = true;
    const auth = req.headers?.authorization || '';
    const result = { hasAuth: !!auth, steps: [] };
    try {
      if (!auth.startsWith('Bearer ')) {
        result.steps.push('No Bearer token');
      } else {
        const token = auth.slice(7);
        result.steps.push('Token extracted, length=' + token.length);
        try {
          const jwksRes = await fetch('https://api.clerk.com/v1/jwks');
          result.steps.push('JWKS fetch status=' + jwksRes.status);
          const jwks = await jwksRes.json();
          result.steps.push('JWKS keys count=' + (jwks.keys?.length || 0));
          const { jwtVerify, createLocalJWKSet } = await import('jose');
          const { payload } = await jwtVerify(token, createLocalJWKSet(jwks), { algorithms: ['RS256'] });
          result.steps.push('JWT verified, iss=' + payload.iss);
          result.steps.push('sub=' + payload.sub);
          result.iss = payload.iss;
          result.issMatchOld = /^https:\/\/clerk\..+\.accounts\.dev$/.test(payload.iss);
          result.issMatchNew = /^https:\/\/.+\.clerk\.accounts\.dev$/.test(payload.iss);
          result.steps.push('iss match (new regex)=' + result.issMatchNew);
        } catch (e2) {
          result.steps.push('Verify error: ' + e2.message);
        }
      }
    } catch (e) {
      result.steps.push('Outer error: ' + e.message);
    }
    return res.status(200).json({ success: true, ...result });
  }

  if (!path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: { message: 'Not found', code: 404 } });
  }

  const matched = matchHandler(req.method || 'GET', path);
  if (!matched) {
    return res.status(404).json({ success: false, error: { message: 'Not found', code: 404 } });
  }

  try {
    const webReq = toWebRequest(req, path);
    const webRes = await matched.handler(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((v, k) => {
      if (!k.toLowerCase().startsWith('content-encoding')) res.setHeader(k, v);
    });
    res.send(await webRes.text());
  } catch (e) {
    console.error('API error [' + req.method + ' ' + path + ']:', e);
    res.status(500).json({ success: false, error: { message: e.message || 'Internal Server Error', code: 500 } });
  }
}

const CACHE_STATIC = 'bibimiao-static-v2';
const CACHE_PAGES = 'bibimiao-pages-v2';

const STATIC_PATTERNS = [/\.(js|css|svg|png|jpg|woff2?)$/, /^\/assets\//];

function isStatic(url) {
  return STATIC_PATTERNS.some((p) => p.test(url.pathname));
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Non-GET requests — network only, never cache
  if (event.request.method !== 'GET') return;

  // API — network only, no caching
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets (hashed filenames) — cache first
  if (isStatic(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
        return cached || fetched;
      })
    );
    return;
  }

  // HTML pages — network first (always get latest deploy)
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_PAGES).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

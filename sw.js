// Unranked BETA service worker — stale-while-revalidate.
// Serves cached responses instantly (fast repeat loads) and refreshes the cache in the background,
// so returning members open the app immediately. On a new deploy the SW self-updates (skipWaiting +
// clients.claim); the page reloads once when the new worker takes control, so content stays fresh.
const CACHE = 'unranked-20261021a';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Never cache the SW script itself — let the browser's update check reach the network.
  if (e.request.url.endsWith('/sw.js')) return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request)
          .then(r => { try { cache.put(e.request, r.clone()); } catch (x) {} return r; })
          .catch(() => cached);
        return cached || network;   // cached instantly if present; else wait for network
      })
    )
  );
});

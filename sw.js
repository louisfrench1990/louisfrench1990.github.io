// Unranked BETA service worker — network-first with offline cache fallback.
// Rebuilt 2026-08-26 (original lost in a workspace reset). Network-first guarantees users always get the
// latest index.html/data on deploy, and still works offline after the first online visit.
const CACHE = 'unranked-20260902e';
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
  e.respondWith(
    fetch(e.request)
      .then(r => {
        try { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); } catch (x) {}
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

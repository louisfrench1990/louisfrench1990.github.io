/* Unranked service worker — network-first for the page (never stuck on a stale deploy), cache fallback for offline */
const CACHE = 'unranked-20260817125414';
// no './' entry — it resolves to the same 5MB document as './index.html'; the navigate handler caches './index.html' and serves it for './' too.
const CORE = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });  // non-atomic: one missing file no longer voids the whole precache
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                       // leave cross-origin (font CDN etc.) untouched
  if (req.mode === 'navigate' || req.destination === 'document') {  // page: fresh when online, cached when offline
    e.respondWith(fetch(req, { cache: 'reload' }).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); } return r; }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));   // cache:'reload' bypasses the browser HTTP cache so a new deploy is never masked by a stale max-age copy; still cache a GOOD page only
    return;
  }
  e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(cc => cc.put(req, cp)); } return r; })));  // never cache an error response: a single 5xx on data-a.json used to lock a device out permanently
});

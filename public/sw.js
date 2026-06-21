/* Service worker — offline cache for the atlas shell + data.
   Cache-first for same-origin static assets; network-first for data JSON
   so corrections propagate. Bump CACHE_VERSION on each release. */
const CACHE_VERSION = 'tasavvuf-atlas-v1';
const CORE = ['./', './index.html', './favicon.svg', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let tiles/fonts/LLM pass through

  const isData = url.pathname.includes('/data/');
  if (isData) {
    // network-first for data
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
  } else {
    // cache-first for shell/assets
    e.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
  }
});

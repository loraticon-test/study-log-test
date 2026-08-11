const CACHE_NAME = 'cozy-dday-v4';
const APP_SHELL = [
  './index.html',
  './manifest-dday.webmanifest',
  '../../assets/js/install-config.js?v=20260811-0001',
  '../../assets/js/dday-app.js?v=20260811-0004',
  '../../assets/css/dday.css?v=20260811-0004'
];
const CACHEABLE_HOSTS = new Set(['cdn.jsdelivr.net']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (CACHEABLE_HOSTS.has(url.hostname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && url.origin === self.location.origin) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request)));
});

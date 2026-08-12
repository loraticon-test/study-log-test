const CACHE_NAME = 'word-review-test-pwa-v12';
const APP_SHELL = [
  './test.html',
  './manifest-test.webmanifest',
  '../../assets/js/install-config.js?v=20260724-0002',
  '../../assets/js/test-app.js?v=20260812-0001',
  '../../assets/js/word-meaning-app.js?v=20260812-0001',
  '../../assets/css/test.css?v=20260812-0001',
  '../../assets/css/word-meaning.css?v=20260812-0001'
];
const OPTIONAL_ASSETS = [
  '../../assets/images/icons/test/icon.svg',
  '../../assets/images/icons/test/icon-192.png',
  '../../assets/images/icons/test/icon-512.png',
  '../../assets/images/icons/test/apple-touch-icon.png'
];
const CACHEABLE_HOSTS = new Set([
  'unpkg.com',
  'cdn.jsdelivr.net'
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(OPTIONAL_ASSETS.map((asset) => cache.add(asset)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (CACHEABLE_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(event.request)))
  );
});

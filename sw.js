
const CACHE = 'courier-pro-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('courier-pro-') && key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  const url = new URL(request.url);
  const isDocument =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html');

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE)
                .then(cache => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          (await caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE)
              .then(cache => cache.put(request, copy))
          );
        }
        return response;
      })
    )
  );
});

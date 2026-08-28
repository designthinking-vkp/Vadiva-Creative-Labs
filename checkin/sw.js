const CACHE_NAME = 'techfest-checkin-v1';
const ASSETS = [
    '/checkin/',
    '/checkin/index.html',
    '/checkin/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

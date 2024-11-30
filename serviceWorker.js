// serviceWorker.js
const CACHE_NAME = 'onepage-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    // Cache CSS
    '/static/css/main.*.css',
    // Cache JS
    '/static/js/main.*.js',
    '/static/js/bundle.*.js'
];

// Installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Activate worker immediately
    self.skipWaiting();
});

// Activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Ensure service worker takes control immediately
    self.clients.claim();
});

// Fetch handler with network-first strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        // Try network first
        fetch(event.request)
            .then(response => {
                // Clone the response because we need to store it in cache
                // and use it to respond
                const responseClone = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        // Store the fetched response in cache
                        cache.put(event.request, responseClone);
                    });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // If both network and cache fail, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Not available offline');
                    });
            })
    );
});
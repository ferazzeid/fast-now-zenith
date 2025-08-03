const CACHE_VERSION = Date.now();
const CACHE_NAME = `fast-now-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Network-first strategy for API calls, cache-first for static assets
const isApiRequest = (url) => {
  return url.includes('/api/') || url.includes('supabase.co');
};

self.addEventListener('install', (event) => {
  console.log('SW: Installing with cache version:', CACHE_VERSION);
  self.skipWaiting(); // Force immediate activation
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch(error => console.error('SW: Cache installation failed:', error))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (isApiRequest(request.url)) {
    // Network-first for API calls
    event.respondWith(
      fetch(request)
        .then(response => {
          // Don't cache failed API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating with cache version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
const VERSION = 'v3';
const APP_SHELL_CACHE = `fastnow-shell-${VERSION}`;
const RUNTIME_CACHE = `fastnow-runtime-${VERSION}`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

const isSupabase = (url) => /\.supabase\.co/.test(url);
const isAsset = (url) => url.origin === self.location.origin && (
  url.pathname.startsWith('/assets/') ||
  url.pathname.endsWith('.js') ||
  url.pathname.endsWith('.css') ||
  url.pathname.endsWith('.woff2') ||
  url.pathname.endsWith('.png') ||
  url.pathname.endsWith('.jpg') ||
  url.pathname.endsWith('.svg')
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!key.includes(VERSION)) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // SPA navigation: serve cached index.html when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          // Cache the latest index.html
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put('/index.html', network.clone());
          return network;
        } catch {
          const cached = await caches.match('/index.html');
          return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
        }
      })()
    );
    return;
  }

  // Always fetch dynamic manifest fresh (never cache)
  if (url.pathname === '/api/dynamic-manifest.json' || url.pathname.includes('/supabase/functions/v1/dynamic-manifest')) {
    event.respondWith(
      fetch(request, { 
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(() => new Response('{}', { 
        headers: { 'Content-Type': 'application/json' } 
      }))
    );
    return;
  }

  // Cache-first for built assets
  if (isAsset(url) && request.method === 'GET') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const network = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, network.clone());
          return network;
        } catch {
          return new Response('', { status: 504 });
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for Supabase GETs
  if (isSupabase(url) && request.method === 'GET') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached ? cached : fetchPromise;
      })()
    );
    return;
  }

  // Default: network-first with cache fallback for GET
  if (request.method === 'GET') {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, network.clone());
          return network;
        } catch {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 504 });
        }
      })()
    );
    return;
  }

  // For non-GET requests, just try the network
  // (Client code should handle offline queuing/optimistic updates)
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
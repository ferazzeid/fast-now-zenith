const VERSION = 'v1758293747270';
const APP_SHELL_CACHE = `fastnow-shell-${VERSION}`;
const RUNTIME_CACHE = `fastnow-runtime-${VERSION}`;
const CRITICAL_DATA_CACHE = `fastnow-data-${VERSION}`;

// Core app shell files
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Critical data endpoints to preload during installation - Enhanced for mobile
const CRITICAL_DATA_ENDPOINTS = [
  // Default foods - essential for food tracking
  'https://texnkijwcygodtywgedm.supabase.co/rest/v1/default_foods?select=*&order=name',
  // App settings and global configuration - including colors
  'https://texnkijwcygodtywgedm.supabase.co/rest/v1/shared_settings?select=*',
  // Color settings specifically for immediate UI
  'https://texnkijwcygodtywgedm.supabase.co/rest/v1/shared_settings?select=setting_key,setting_value&setting_key=in.(brand_primary_color,brand_primary_hover,brand_accent_color,brand_ai_color,chat_ai_color,chat_user_color)',
  // System motivators
  'https://texnkijwcygodtywgedm.supabase.co/rest/v1/shared_settings?select=setting_value&setting_key=eq.predefined_motivators',
  // SEO settings for mobile
  'https://texnkijwcygodtywgedm.supabase.co/rest/v1/shared_settings?select=setting_key,setting_value&setting_key=in.(seo_index_homepage,seo_index_other_pages)'
];

// Headers for Supabase requests - Updated to match client API key
const SUPABASE_HEADERS = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
  'Content-Type': 'application/json'
};

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
  console.log('🚀 FastNow Service Worker installing with comprehensive preloading...');
  self.skipWaiting();
  
  event.waitUntil(
    (async () => {
      try {
        // 1. Cache app shell files
        console.log('📦 Caching app shell...');
        const shellCache = await caches.open(APP_SHELL_CACHE);
        await shellCache.addAll(APP_SHELL_URLS);
        
        // 2. Preload critical data during installation
        console.log('🗄️  Preloading critical data...');
        const dataCache = await caches.open(CRITICAL_DATA_CACHE);
        
        const dataPromises = CRITICAL_DATA_ENDPOINTS.map(async (endpoint) => {
          try {
            console.log(`📥 Preloading: ${endpoint}`);
            const response = await fetch(endpoint, { 
              headers: SUPABASE_HEADERS,
              cache: 'no-cache' // Always get fresh data during install
            });
            
            if (response.ok) {
              const data = await response.text();
              console.log(`📊 Response size: ${data.length} bytes for ${endpoint}`);
              
              // Store both response and metadata for better cache management
              await dataCache.put(endpoint, new Response(data, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  ...Object.fromEntries(response.headers),
                  'x-cached-at': new Date().toISOString(),
                  'x-cache-source': 'service-worker-install'
                }
              }));
              console.log(`✅ Cached: ${endpoint}`);
            } else {
              console.warn(`⚠️  Failed to preload ${endpoint}: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Error preloading ${endpoint}:`, error);
            // Don't let individual endpoint failures break the entire install
          }
        });
            } else {
              console.warn(`⚠️  Failed to cache ${endpoint}: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.warn(`❌ Error caching ${endpoint}:`, error);
          }
        });
        
        await Promise.allSettled(dataPromises);
        console.log('🎉 Installation complete with data preloading!');
        
        // Send message to client about successful installation
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ 
              type: 'INSTALL_COMPLETE',
              message: 'App ready!'
            });
          });
        });
        
      } catch (error) {
        console.error('💥 Installation failed:', error);
        throw error;
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      const deletePromises = keys.map((key) => {
        if (!key.includes(VERSION)) {
          console.log(`🗑️  Deleting old cache: ${key}`);
          return caches.delete(key);
        }
      });
      
      await Promise.all(deletePromises);
      await self.clients.claim();
      console.log('✅ Service Worker activated and claimed clients');
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
          // For SPA routes, always serve the cached index.html which contains the React app
          const cached = await caches.match('/index.html');
          if (cached) {
            // Clone the response to modify headers
            const modifiedResponse = new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers: {
                ...Object.fromEntries(cached.headers.entries()),
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              }
            });
            return modifiedResponse;
          }
          
          // Last resort fallback - but this should rarely be reached
          // since we cache index.html during install
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>FastNow - Offline</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                  padding: 20px; text-align: center; 
                  background: #f5f5f5;
                }
                .offline-msg { 
                  margin-top: 50px; color: #666; 
                  max-width: 400px; margin: 50px auto;
                }
                .retry-btn {
                  background: #007AFF; color: white; border: none;
                  padding: 12px 24px; border-radius: 6px; margin-top: 20px;
                  cursor: pointer; font-size: 16px;
                }
              </style>
            </head>
            <body>
              <div class="offline-msg">
                <h1>You're Offline</h1>
                <p>Please check your internet connection and try again.</p>
                <button class="retry-btn" onclick="location.reload()">Retry</button>
              </div>
            </body>
            </html>
          `, { headers: { 'Content-Type': 'text/html' } });
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

  // Priority cache-first for critical data endpoints
  if (isSupabase(url) && request.method === 'GET' && CRITICAL_DATA_ENDPOINTS.includes(request.url)) {
    event.respondWith(
      (async () => {
        // Check critical data cache first
        const dataCache = await caches.open(CRITICAL_DATA_CACHE);
        const cached = await dataCache.match(request);
        
        if (cached) {
          console.log(`🎯 Serving critical data from cache: ${request.url}`);
          
          // Background update for fresh data (stale-while-revalidate)
          fetch(request, { headers: SUPABASE_HEADERS })
            .then((response) => {
              if (response && response.ok) {
                dataCache.put(request, response.clone());
                console.log(`🔄 Updated critical data cache: ${request.url}`);
              }
            })
            .catch((error) => {
              console.warn(`⚠️  Background update failed for ${request.url}:`, error);
            });
          
          return cached;
        }
        
        // If not cached, fetch and cache
        try {
          const response = await fetch(request, { headers: SUPABASE_HEADERS });
          if (response && response.ok) {
            dataCache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          console.error(`❌ Failed to fetch critical data ${request.url}:`, error);
          return new Response('{}', { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for other Supabase GETs
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
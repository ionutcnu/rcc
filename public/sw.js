const CACHE_NAME = 'rcc-static-v2';
const IMAGE_CACHE = 'rcc-optimized-images-v2';
const API_CACHE = 'rcc-api-cache-v1';

// URLs to cache on install
const urlsToCache = [
  '/logo.svg',
  '/favicon.ico',
  '/sw.js',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Cache strategies
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle image requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle image optimization API calls
  if (url.pathname.startsWith('/api/image-optimize') || url.pathname.startsWith('/api/image-proxy')) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Handle Firebase Storage images
  if (url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Handle other image requests
  if (event.request.destination === 'image') {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Default fetch for non-image requests
  event.respondWith(fetch(event.request));
});

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Image fetch failed:', error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder for failed image loads
    return new Response(
      '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Background sync for failed image requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-image-sync') {
    event.waitUntil(retryFailedImageRequests());
  }
});

async function retryFailedImageRequests() {
  // Implementation for retrying failed image requests
  console.log('Retrying failed image requests...');
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    event.waitUntil(
      caches.delete(IMAGE_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    event.waitUntil(
      preloadImages(event.data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

async function preloadImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);
  
  const preloadPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to preload image:', url, error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
}
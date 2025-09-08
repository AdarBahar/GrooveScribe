/**
 * Service Worker for GrooveScribe PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'groovescribe-v2.2.1';
const urlsToCache = [
  './',
  './index.html',
  './css/groove_writer_orange.css',
  './css/groove_display_orange.css',
  './css/share-button.min.css',
  './js/main.js',
  './js/groove_writer.js',
  './js/groove_utils.js',
  './js/grooves.js',
  './js/abc2svg-1.js',
  './js/pablo.min.js',
  './js/share-button.min.js',
  './js/jsmidgen.js',
  './images/GScribe_Logo_lone_g.svg',
  './images/GScribe_Logo_word_stack.svg'
];

// Install event - cache resources and activate immediately
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache resources individually to avoid failing on missing files
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err.message);
              return null;
            })
          )
        );
      })
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Cached ${successful} resources, ${failed} failed`);
      })
      .catch(error => {
        console.error('Failed to open cache:', error);
      })
      .finally(() => self.skipWaiting())
  );
});

// Fetch event - network-first for HTML, stale-while-revalidate for CSS/JS
self.addEventListener('fetch', event => {
  const req = event.request;

  // Bypass non-GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Avoid caching cache-busted URLs aggressively
  if (url.searchParams.has('cb')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

  // Network-first for navigations and HTML documents
  if (req.mode === 'navigate' || req.destination === 'document' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(new Request(req, { cache: 'reload' })).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      }).catch(() => caches.match(req).then(resp => resp || caches.match('./index.html')))
    );
    return;
  }

  // Stale-while-revalidate for CSS/JS
  if (req.destination === 'script' || req.destination === 'style') {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkResp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req).then(networkResp => {
      if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
        const copy = networkResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return networkResp;
    }))
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return undefined;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for saving grooves when online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-grooves') {
    event.waitUntil(syncGrooves());
  }
});

async function syncGrooves() {
  try {
    // Get pending grooves from IndexedDB
    const pendingGrooves = await getPendingGrooves();
    
    for (const groove of pendingGrooves) {
      try {
        // Attempt to sync groove to server
        await syncGrooveToServer(groove);
        // Remove from pending list on success
        await removePendingGroove(groove.id);
      } catch (error) {
        console.error('Failed to sync groove:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for groove syncing
async function getPendingGrooves() {
  // Implementation would use IndexedDB to get pending grooves
  return [];
}

async function syncGrooveToServer(groove) {
  // Implementation would sync groove to server
  console.log('Syncing groove:', groove);
}

async function removePendingGroove(id) {
  // Implementation would remove groove from pending list
  console.log('Removing pending groove:', id);
}

// Push notifications for groove sharing
self.addEventListener('push', event => {
  const options = {
    body: 'A new groove has been shared with you!',
    icon: '/images/gscribe-icon-192.png',
    badge: '/images/gscribe-icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open GrooveScribe',
        icon: '/images/gscribe-icon-96.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/images/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GrooveScribe', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

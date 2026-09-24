/* Fit Ninja Service Worker — High-Performance Offline PWA Engine v47 */
const CACHE_NAME = 'fitninja-offline-v47'

const PRECACHE_URLS = [
  '/app',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
]

// 1. Install & Precache core app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Precache what we can; don't fail install if an individual icon is missing
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url)
        } catch (e) {
          console.warn('[Fit Ninja SW] Precache note for:', url, e.message)
        }
      }
    }).then(() => self.skipWaiting())
  )
})

// 2. Clean up old cache versions on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('[Fit Ninja SW] Purging old cache:', k)
          return caches.delete(k)
        }
      }))
    ).then(() => self.clients.claim())
  )
})

// 3. Fetch interceptor: Network-first with automatic offline fallback
self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle GET requests from our origin
  if (req.method !== 'GET') return
  if (url.origin !== location.origin) return

  // Skip dynamic backend API endpoints
  if (url.pathname.startsWith('/api/')) return

  // Navigation & HTML requests (e.g. /app, /app?mode=signup, /)
  if (req.mode === 'navigate' || url.pathname === '/app' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, clone)
              // Also store under '/app' so offline navigation always finds it
              if (url.pathname === '/app' || req.mode === 'navigate') {
                cache.put('/app', networkRes.clone())
              }
            })
          }
          return networkRes
        })
        .catch(async () => {
          // Offline fallback: check exact request, then fallback to cached '/app' shell
          const cached = await caches.match(req)
          if (cached) return cached
          const appShell = await caches.match('/app')
          if (appShell) return appShell
          return caches.match('/index.html')
        })
    )
    return
  }

  // App bundles, CSS, JS, fonts, exercise data, images
  event.respondWith(
    fetch(req)
      .then(networkRes => {
        if (networkRes && networkRes.ok) {
          const clone = networkRes.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone))
        }
        return networkRes
      })
      .catch(async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        return new Response('Network unavailable (Offline)', { status: 503, statusText: 'Offline' })
      })
  )
})

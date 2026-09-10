/* Fit Ninja Service Worker — cache purging engine v33 */
const CACHE = 'fitninja-v33'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE) return caches.delete(k)
      }))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Always force network-first for /app and html files
  if (url.pathname === '/app' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }

  // Network-first strategy for app bundle
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
      }
      return res
    }).catch(() => caches.match(e.request))
  )
})

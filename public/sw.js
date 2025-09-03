const CACHE_NAME = "cambodia-admin-portal-v3"
const urlsToCache = [
  "/",
  "/search",
  "/map",
  "/details",
  "/data",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching app shell")
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("[SW] Failed to cache some resources:", error)
          // Continue installation even if some resources fail to cache
          return Promise.resolve()
        })
      })
      .then(() => {
        console.log("[SW] Skip waiting on install")
        return self.skipWaiting()
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Claiming clients")
        return self.clients.claim()
      }),
  )
})

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url)
  const currentUrl = new URL(self.location.href)

  // Skip cross-origin requests, but allow same-origin preview URLs
  if (requestUrl.origin !== currentUrl.origin) {
    return
  }

  // Network-first strategy for API calls and dynamic content
  if (event.request.url.includes("/api/") || event.request.url.includes("/data")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request)
        }),
    )
    return
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clone the response before caching
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })

        return response
      })
    }),
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Received skip waiting message")
    self.skipWaiting()
  }
})

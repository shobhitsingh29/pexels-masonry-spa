/// <reference lib="webworker" />

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = "pexels-masonry-v1"
const IMAGE_CACHE_NAME = "pexels-images-v1"
const API_CACHE_NAME = "pexels-api-v1"

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
  "/static/js/vendors~main.chunk.js",
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
          return null
        }),
      )
    }),
  )
  self.clients.claim()
})

// Helper function to determine if a request is for an image
function isImageRequest(request: Request): boolean {
  const url = new URL(request.url)
  return (
    request.method === "GET" &&
    (url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".jpeg") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".gif") ||
      url.pathname.includes("images.pexels.com"))
  )
}

// Helper function to determine if a request is for the Pexels API
function isPexelsApiRequest(request: Request): boolean {
  return request.url.includes("api.pexels.com")
}

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes("api.pexels.com") &&
    !event.request.url.includes("images.pexels.com")
  ) {
    return
  }

  // Handle image requests with a cache-first strategy
  if (isImageRequest(event.request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Return cached response if available
          if (response) {
            return response
          }

          // Otherwise fetch from network, cache, and return
          return fetch(event.request)
            .then((networkResponse) => {
              // Clone the response before caching
              const responseToCache = networkResponse.clone()

              // Only cache successful responses
              if (networkResponse.status === 200) {
                cache.put(event.request, responseToCache)
              }

              return networkResponse
            })
            .catch((error) => {
              console.error("Fetch failed:", error)
              // Return a fallback image or error
              return new Response("Image not available", { status: 404 })
            })
        })
      }),
    )
    return
  }

  // Handle Pexels API requests with a network-first strategy
  if (isPexelsApiRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone()

          // Only cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }

          return response
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.open(API_CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // If not in cache, return error
              return new Response(JSON.stringify({ error: "Network error" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              })
            })
          })
        }),
    )
    return
  }

  // For other requests, use a stale-while-revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses for GET requests
            if (networkResponse.status === 200 && event.request.method === "GET") {
              cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch((error) => {
            console.error("Fetch failed:", error)
            throw error
          })

        // Return the cached response immediately, or wait for network
        return response || fetchPromise
      })
    }),
  )
})

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

export {}

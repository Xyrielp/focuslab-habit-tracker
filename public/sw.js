const CACHE_NAME = 'focuslab-v3'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
  '/offline.html'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response
            }
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                if (event.request.url.includes('_next/static') || 
                    event.request.url.includes('.js') || 
                    event.request.url.includes('.css') ||
                    event.request.destination === 'document') {
                  cache.put(event.request, responseToCache)
                }
              })
            return response
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/') || new Response('App works offline!', {
                headers: { 'Content-Type': 'text/html' }
              })
            }
            return new Response('Offline', { status: 503 })
          })
      })
  )
})
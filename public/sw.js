// Minimal service worker: cache-first for the app shell so the PWA installs and
// works offline. Bump CACHE_VERSION to invalidate.
const CACHE_VERSION = 'black-heron-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Never cache the Lichess API — puzzles are fetched live.
  if (url.hostname === 'lichess.org') return
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
          }
          return response
        }),
    ),
  )
})

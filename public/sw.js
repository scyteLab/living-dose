/*
 * Living Dose service worker: makes the app installable and keeps it usable on
 * a weak or dropped connection.
 *   Pages:            network first, falling back to the saved app (it can show
 *                     everything stored on the device), then to /offline.html.
 *   Built files:      cache first (their names change whenever they change).
 *   Fonts:            cache first.
 *   Everything else from this site: use the saved copy, refresh it in the background.
 * Requests to other servers (such as Supabase) are never cached.
 * Bump VERSION when this file changes.
 */
const VERSION = 'ld-v1'
const SHELL = ['/', '/offline.html', '/favicon.svg', '/icon-192.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirstPage(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(VERSION)
    cache.put('/', response.clone())
    return response
  } catch {
    return (await caches.match('/')) || (await caches.match('/offline.html'))
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(VERSION)).put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) (await caches.open(VERSION)).put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached || refresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === 'https://fonts.gstatic.com' || url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(cacheFirst(request))
    return
  }
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') event.respondWith(networkFirstPage(request))
  else if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request))
  else event.respondWith(staleWhileRevalidate(request))
})

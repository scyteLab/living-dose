/**
 * Turns on the service worker (public/sw.js) in the live site only. In
 * development it would serve stale files while you edit, so it stays off.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Not supported or blocked: the site still works normally */
    })
  })
}

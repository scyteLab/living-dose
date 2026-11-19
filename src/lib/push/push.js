/**
 * Phone notifications in the browser: ask permission, subscribe this phone and
 * save it, so the server can send check-in reminders and family alerts.
 * Works on Android and computers; on iPhone only after "Add to Home Screen" (iOS 16.4+).
 */
import { isDemo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const FN = '/.netlify/functions/push'

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

/** 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on' */
export async function pushState() {
  if (!pushSupported()) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

/** The server's public key, turned into the bytes the browser wants. */
export function keyBytes(base64url) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function token() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const pushError = (kind) => Object.assign(new Error(kind), { kind })

/** Ask permission and subscribe this phone. Resolves when it's saved. */
export async function enablePush(userId) {
  if (!pushSupported()) throw pushError(isIos() ? 'ios-install' : 'unsupported')
  if (isDemo) throw pushError('not-live')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw pushError('denied')

  const res = await fetch(FN)
  if (!res.ok) throw pushError('not-configured')
  const { publicKey } = await res.json()

  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }))
  const json = sub.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { endpoint: json.endpoint, user_id: userId, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent.slice(0, 300) },
      { onConflict: 'endpoint' },
    )
  if (error) throw pushError('save')
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  if (!isDemo) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

async function call(action) {
  if (isDemo) return { sent: 0 }
  const t = await token()
  if (!t) return { sent: 0 }
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${t}` },
    body: JSON.stringify({ action }),
  })
  return res.ok ? res.json() : { sent: 0 }
}

export const sendTestPush = () => call('test')

/** After a check-in with a warning sign: the server checks it and alerts family helpers. */
export const alertFamily = () => call('family').catch(() => ({ sent: 0 }))

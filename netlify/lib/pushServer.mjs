/**
 * Server side of phone notifications: a Supabase client with the service role
 * (it can read across members, so it lives only in Netlify functions) and a sender.
 *
 * Netlify environment variables:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   from `npx web-push generate-vapid-keys` (private one secret)
 *   VAPID_SUBJECT                          e.g. mailto:hello@yourdomain.com
 *   SUPABASE_SERVICE_ROLE_KEY              Supabase → Project Settings → API keys (secret!)
 *   VITE_SUPABASE_URL                      already set for the app
 */
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export function pushConfigured(env = process.env) {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.SUPABASE_SERVICE_ROLE_KEY && env.VITE_SUPABASE_URL)
}

export function adminClient(env = process.env) {
  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

let vapidSet = false
function setVapid(env = process.env) {
  if (vapidSet) return
  webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:hello.scyte@gmail.com', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  vapidSet = true
}

/**
 * Sends one message to every device of the given members. Devices that no longer
 * exist (404/410) are removed. Resolves with how many devices received it.
 */
const webPushSend = (message) => (sub, payload) => {
  setVapid()
  return webpush.sendNotification(sub, payload, { TTL: 6 * 60 * 60, urgency: message.urgent ? 'high' : 'normal' })
}

export async function sendToUsers(db, userIds, message, { send = webPushSend(message) } = {}) {
  if (!userIds.length) return 0
  const { data: subs, error } = await db.from('push_subscriptions').select('endpoint, user_id, p256dh, auth').in('user_id', userIds)
  if (error) throw error
  const payload = JSON.stringify(message)
  let ok = 0
  const dead = []
  const alive = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        ok += 1
        alive.push(s.endpoint)
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.endpoint)
        else console.error('push: send failed', err?.statusCode, String(err?.body ?? err?.message ?? '').slice(0, 200))
      }
    }),
  )
  if (dead.length) await db.from('push_subscriptions').delete().in('endpoint', dead)
  if (alive.length) await db.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).in('endpoint', alive)
  return ok
}

/**
 * /.netlify/functions/push
 *   GET                         → { publicKey } so the app can subscribe this phone
 *   POST { action: 'test' }     → sends a test notification to the member's own phones
 *   POST { action: 'family' }   → if the member's check-in today has a warning sign,
 *                                 alerts their family helpers (once per day per helper)
 * POST needs the member's Supabase access token. The server re-reads the check-in
 * itself, so nobody can send alerts that aren't backed by a real check-in.
 */
import { familyAlertMessage, lagosNow, urgentKeys } from '../lib/push.mjs'
import { adminClient, pushConfigured, sendToUsers } from '../lib/pushServer.mjs'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export default async (req) => {
  if (!pushConfigured()) return json({ error: 'not-configured' }, 503)
  if (req.method === 'GET') return json({ publicKey: process.env.VAPID_PUBLIC_KEY })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'not-signed-in' }, 401)
  const db = adminClient()
  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth?.user) return json({ error: 'not-signed-in' }, 401)
  const user = auth.user

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad-request' }, 400)
  }

  try {
    if (body?.action === 'test') {
      const sent = await sendToUsers(db, [user.id], {
        title: 'Living Dose',
        body: 'Notifications are on. We’ll remind you to check in each day.',
        url: '/check-in',
        tag: 'test',
      })
      return json({ sent })
    }

    if (body?.action === 'family') {
      const { date } = lagosNow()
      const { data: checkin } = await db.from('health_checkins').select('flags').eq('user_id', user.id).eq('day', date).maybeSingle()
      const keys = urgentKeys(checkin?.flags)
      if (!keys.length) return json({ sent: 0 })

      const { data: links } = await db.from('family_links').select('helper_id, owner_name').eq('owner_id', user.id)
      if (!links?.length) return json({ sent: 0 })
      const { data: logged } = await db.from('push_log').select('user_id').eq('kind', 'family-urgent').eq('ref', user.id).eq('day', date)
      const done = new Set((logged ?? []).map((l) => l.user_id))
      const helpers = links.filter((l) => !done.has(l.helper_id))
      if (!helpers.length) return json({ sent: 0, already: true })

      const sent = await sendToUsers(
        db,
        helpers.map((h) => h.helper_id),
        familyAlertMessage(links[0].owner_name, keys),
      )
      await db.from('push_log').upsert(
        helpers.map((h) => ({ user_id: h.helper_id, kind: 'family-urgent', ref: user.id, day: date })),
        { onConflict: 'user_id,kind,ref,day', ignoreDuplicates: true },
      )
      return json({ sent })
    }
  } catch (err) {
    console.error('push:', err?.message ?? err)
    return json({ error: 'failed' }, 502)
  }
  return json({ error: 'bad-request' }, 400)
}

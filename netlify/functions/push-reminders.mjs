/**
 * Runs every hour (Netlify scheduled function). Sends the daily check-in reminder
 * to members who want it at this hour (Lagos time) and haven't checked in yet.
 */
import { lagosNow, reminderMessage, shouldRemind, streakBefore } from '../lib/push.mjs'
import { adminClient, pushConfigured, sendToUsers } from '../lib/pushServer.mjs'

export const config = { schedule: '@hourly' }

export async function runReminders(db, now = new Date(), { sendTo = sendToUsers } = {}) {
  const { date } = lagosNow(now)
  const { data: subs, error } = await db.from('push_subscriptions').select('user_id')
  if (error) throw error
  const userIds = [...new Set(subs.map((s) => s.user_id))]
  if (!userIds.length) return { sent: 0, considered: 0 }

  const since = new Date(now.getTime() - 40 * 86_400_000).toISOString().slice(0, 10)
  const [prefs, checkins, logged, profiles] = await Promise.all([
    db.from('user_documents').select('user_id, data').eq('kind', 'notifications').in('user_id', userIds),
    db.from('health_checkins').select('user_id, day').gte('day', since).in('user_id', userIds),
    db.from('push_log').select('user_id').eq('kind', 'checkin-reminder').eq('day', date).in('user_id', userIds),
    db.from('profiles').select('id, first_name').in('id', userIds),
  ])
  const prefsBy = new Map((prefs.data ?? []).map((p) => [p.user_id, p.data]))
  const daysBy = new Map()
  for (const c of checkins.data ?? []) daysBy.set(c.user_id, [...(daysBy.get(c.user_id) ?? []), c.day])
  const sentAlready = new Set((logged.data ?? []).map((l) => l.user_id))
  const nameBy = new Map((profiles.data ?? []).map((p) => [p.id, p.first_name]))

  let sent = 0
  for (const id of userIds) {
    const days = daysBy.get(id) ?? []
    if (!shouldRemind({ prefs: prefsBy.get(id), now, checkedInToday: days.includes(date), alreadySent: sentAlready.has(id) })) continue
    const n = await sendTo(db, [id], reminderMessage(nameBy.get(id), streakBefore(days, date)))
    if (n > 0) {
      sent += 1
      await db
        .from('push_log')
        .upsert({ user_id: id, kind: 'checkin-reminder', ref: '', day: date }, { onConflict: 'user_id,kind,ref,day', ignoreDuplicates: true })
    }
  }
  return { sent, considered: userIds.length }
}

export default async () => {
  if (!pushConfigured()) return new Response('not configured', { status: 200 })
  try {
    const result = await runReminders(adminClient())
    console.log('push-reminders:', JSON.stringify(result))
    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    console.error('push-reminders:', err?.message ?? err)
    return new Response('failed', { status: 500 })
  }
}

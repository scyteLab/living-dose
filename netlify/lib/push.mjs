/**
 * Shared rules for phone notifications (used by the push functions, and tested).
 * Times are Lagos time, which is where members are.
 */
export const TZ = 'Africa/Lagos'

/** { date: 'YYYY-MM-DD', minutes: minutes since midnight } in Lagos. */
export function lagosNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const toMinutes = (hhmm, fallback) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback
}

/** Quiet hours can cross midnight (e.g. 21:30 to 07:00). */
export function inQuietHours(minutes, quietStart = '21:30', quietEnd = '07:00') {
  const s = toMinutes(quietStart, 21 * 60 + 30)
  const e = toMinutes(quietEnd, 7 * 60)
  if (s === e) return false
  return s < e ? minutes >= s && minutes < e : minutes >= s || minutes < e
}

/**
 * Should this member get today's check-in reminder in this hourly run?
 * Yes when: they want check-in reminders and phone notifications, it's the hour
 * they chose, it isn't quiet time, they haven't checked in, and it wasn't sent yet.
 */
export function shouldRemind({ prefs, now, checkedInToday, alreadySent }) {
  if (checkedInToday || alreadySent) return false
  if (prefs?.checkIn === false || prefs?.channels?.push === false) return false
  const { minutes } = lagosNow(now)
  const at = toMinutes(prefs?.checkInTime, 18 * 60)
  if (Math.floor(minutes / 60) !== Math.floor(at / 60)) return false
  return !inQuietHours(minutes, prefs?.quietStart, prefs?.quietEnd)
}

/** Days in a row with a check-in, ending yesterday (today isn't done yet when we remind). */
export function streakBefore(days, today) {
  const set = new Set(days)
  let count = 0
  const d = new Date(`${today}T12:00:00Z`)
  for (;;) {
    d.setUTCDate(d.getUTCDate() - 1)
    if (!set.has(d.toISOString().slice(0, 10))) return count
    count += 1
  }
}

export function reminderMessage(name, streak) {
  const who = name ? `${name}, how` : 'How'
  return {
    title: streak > 1 ? `🔥 Keep your ${streak}-day streak` : 'Your daily check-in',
    body: `${who} are you today? It takes one minute.`,
    url: '/check-in',
    tag: 'checkin-reminder',
  }
}

const URGENT_WORDS = {
  chestPain: 'chest pain',
  breathless: 'difficulty breathing',
  bpVeryHigh: 'very high blood pressure',
  sugarLow: 'low blood sugar',
  sugarVeryHigh: 'very high blood sugar',
}

export const urgentKeys = (flags) => (Array.isArray(flags) ? flags : []).filter((f) => typeof f === 'string' && f.startsWith('urgent:')).map((f) => f.slice(7))

export function familyAlertMessage(ownerName, keys) {
  const what = keys.map((k) => URGENT_WORDS[k] ?? 'a warning sign').join(', ')
  return {
    title: `⚠️ ${ownerName} reported ${what}`,
    body: `Please call ${ownerName} now. If they don't answer or feel faint, call 112.`,
    url: '/family',
    tag: `family-urgent`,
    urgent: true,
  }
}

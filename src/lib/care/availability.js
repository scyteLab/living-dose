/**
 * Bookable times for a professional, in Lagos time (UTC+1, no daylight saving).
 * Slots come from their weekly schedule, minus times already booked and
 * anything too soon to prepare for.
 */
import { care } from '@/config/care'

const LAGOS_OFFSET_MIN = 60 // Africa/Lagos is always UTC+1

/** A Date for a Lagos wall-clock time. */
export function lagosTime(y, m, d, hour, minute = 0) {
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - LAGOS_OFFSET_MIN * 60 * 1000)
}

/** Lagos calendar date (YYYY-MM-DD) and weekday (0 = Monday) for a moment. */
export function lagosDay(date) {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MIN * 60 * 1000)
  const iso = shifted.toISOString().slice(0, 10)
  return { iso, weekday: (shifted.getUTCDay() + 6) % 7 }
}

/**
 * Days with their open slots: [{ date: 'YYYY-MM-DD', slots: [ISO start times] }]
 * `booked` is a Set of ISO start times already taken.
 */
export function availableDays(professional, { now = new Date(), days = care.daysAhead, booked = new Set() } = {}) {
  const earliest = now.getTime() + care.minNoticeMinutes * 60 * 1000
  const { iso: todayIso } = lagosDay(now)
  const [ty, tm, td] = todayIso.split('-').map(Number)
  const out = []
  for (let i = 0; i < days; i++) {
    const noon = lagosTime(ty, tm, td + i, 12)
    const { iso, weekday } = lagosDay(noon)
    const hours = professional.schedule[weekday]
    if (!hours || professional.daysOff?.includes(iso)) continue
    const [y, m, d] = iso.split('-').map(Number)
    const slots = []
    for (let mins = hours[0] * 60; mins + care.slotMinutes <= hours[1] * 60; mins += care.slotMinutes) {
      const start = lagosTime(y, m, d, Math.floor(mins / 60), mins % 60)
      if (start.getTime() < earliest) continue
      const key = start.toISOString()
      if (!booked.has(`${professional.id}|${key}`)) slots.push(key)
    }
    if (slots.length) out.push({ date: iso, slots })
  }
  return out
}

export function nextAvailable(professional, options) {
  const days = availableDays(professional, options)
  return days[0]?.slots[0] ?? null
}

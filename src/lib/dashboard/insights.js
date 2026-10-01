/**
 * Small summaries for the Home dashboard, worked out from what's stored on the
 * device: the meal-logging streak, this week's days, water and activity.
 */
import { addDays, toIso, weekStartOf } from '@/lib/mealPlan/storage'

const dayIndexIn = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7 // Monday = 0
}

/** Was at least one meal marked as eaten on this day? */
export function loggedOn(planStore, iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const week = planStore.weeks?.[weekStartOf(new Date(y, m - 1, d))]
  if (!week) return false
  const prefix = `${dayIndexIn(iso)}.`
  return Object.entries(week.eaten ?? {}).some(([k, v]) => v && k.startsWith(prefix))
}

/**
 * Days in a row with meals logged. Today only counts once something is logged,
 * so the streak isn't "broken" first thing in the morning.
 */
export function mealStreak(planStore, today = new Date()) {
  let iso = toIso(today)
  if (!loggedOn(planStore, iso)) iso = addDays(iso, -1)
  let count = 0
  while (count < 366 && loggedOn(planStore, iso)) {
    count++
    iso = addDays(iso, -1)
  }
  return count
}

/** This week, Monday to Sunday: [{ date, logged, isToday, isFuture }] */
export function weekDays(planStore, today = new Date()) {
  const start = weekStartOf(today)
  const todayIso = toIso(today)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, logged: loggedOn(planStore, date), isToday: date === todayIso, isFuture: date > todayIso }
  })
}

/** Total active minutes Monday to today. */
export function weekMinutes(habits, today = new Date()) {
  return weekDays({}, today)
    .filter((d) => !d.isFuture)
    .reduce((sum, d) => sum + (habits[d.date]?.minutes ?? 0), 0)
}

/** Average glasses of water a day this week, over the days with anything logged. */
export function weekWaterAverage(habits, today = new Date()) {
  const days = weekDays({}, today).filter((d) => !d.isFuture && habits[d.date]?.water > 0)
  if (days.length === 0) return null
  return Math.round((days.reduce((s, d) => s + habits[d.date].water, 0) / days.length) * 2) / 2
}

/** Days left in the week, counting today. */
export const daysLeftInWeek = (today = new Date()) => 7 - ((today.getDay() + 6) % 7)

/** Getting-started checklist: which of the four first steps are done. */
export function gettingStarted({ hasResult, planSeen, hasOrder, hasAppointment }) {
  const steps = [
    { id: 'check', done: hasResult, to: '/health-check' },
    { id: 'plan', done: planSeen, to: '/plan', locked: !hasResult },
    { id: 'shop', done: hasOrder, to: '/shop' },
    { id: 'care', done: hasAppointment, to: '/care' },
  ]
  return { steps, done: steps.filter((s) => s.done).length, next: steps.find((s) => !s.done && !s.locked) ?? null }
}

/** "morning" | "afternoon" | "evening", by the person's own clock. */
export function partOfDay(now = new Date()) {
  const h = now.getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

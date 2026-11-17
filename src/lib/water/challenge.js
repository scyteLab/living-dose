/**
 * Water challenge: each verified live selfie adds a glass to today's water
 * (the same count as the Home page and the community Water week challenge).
 * Selfie thumbnails stay on this device for today only; they're never uploaded
 * or synced.
 */
import { WATER_GOAL, dayOf, loadHabits, saveHabits } from '@/lib/dashboard/habits'
import { toIso } from '@/lib/mealPlan/storage'

export const MAX_GLASSES = 12 // a sensible daily ceiling
export const MIN_GAP_MS = 2 * 60 * 1000 // at least 2 minutes between glasses

const key = (userId) => `ld.water.selfies.${userId}`

/** Today's selfies: [{ at, thumb, verified }] */
export function loadSelfies(userId, today = toIso(new Date()), storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(key(userId)))
    return saved?.date === today ? saved.items : []
  } catch {
    return []
  }
}

/** Whether another glass can be counted right now, and if not, why. */
export function canLog(selfies, water, now = Date.now()) {
  if (water >= MAX_GLASSES) return { ok: false, reason: 'max' }
  const last = selfies.at(-1)
  if (last && now - new Date(last.at).getTime() < MIN_GAP_MS) return { ok: false, reason: 'tooSoon', waitMs: MIN_GAP_MS - (now - new Date(last.at).getTime()) }
  return { ok: true }
}

/** Records a verified selfie and adds a glass. Returns today's new water count. */
export function logGlass(userId, { thumb, verified }, now = new Date(), storage = window.localStorage) {
  const today = toIso(now)
  const habits = loadHabits(userId)
  const water = Math.min(MAX_GLASSES, dayOf(habits, today).water + 1)
  saveHabits(userId, { ...habits, [today]: { ...dayOf(habits, today), water } })
  const items = [...loadSelfies(userId, today, storage), { at: now.toISOString(), thumb, verified }].slice(-MAX_GLASSES)
  try {
    storage.setItem(key(userId), JSON.stringify({ date: today, items }))
  } catch {
    // Storage full: the glass still counts, we just don't keep the picture
  }
  return water
}

export const todaysWater = (userId, today = toIso(new Date())) => dayOf(loadHabits(userId), today).water

export { WATER_GOAL }

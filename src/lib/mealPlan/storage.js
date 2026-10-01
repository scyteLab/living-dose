/**
 * Meal plans live on this device for now (Supabase later): the settings, and for
 * each week the generated plan, any swaps, meals marked as eaten, and ticked
 * shopping-list items.
 */
import { DEFAULT_SETTINGS } from './generate'

const key = (userId) => `ld.plan.${userId}`

export function loadPlanStore(userId) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key(userId)))
    return { settings: { ...DEFAULT_SETTINGS, ...stored?.settings }, weeks: stored?.weeks ?? {} }
  } catch {
    return { settings: DEFAULT_SETTINGS, weeks: {} }
  }
}

export function savePlanStore(userId, store) {
  try {
    // Keep the last 8 weeks only
    const weeks = Object.fromEntries(Object.entries(store.weeks).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 8))
    window.localStorage.setItem(key(userId), JSON.stringify({ ...store, weeks }))
  } catch {
    /* storage full or blocked */
  }
}

/** Monday of the week containing `date`, as YYYY-MM-DD in local time. */
export function weekStartOf(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  return toIso(d)
}

export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return toIso(new Date(y, m - 1, d + n))
}

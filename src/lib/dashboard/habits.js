/**
 * Daily habits kept on this device: water (glasses), active minutes and a
 * private mood check-in, one entry per calendar day. The last 90 days are kept.
 */
const key = (userId) => `ld.habits.${userId}`
export const WATER_GOAL = 8 // glasses of about 250 ml
export const MINUTES_GOAL = 30 // a day, which adds up to more than WHO's 150 a week

export const MOODS = ['great', 'good', 'okay', 'low', 'struggling']

export function loadHabits(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(key(userId))) ?? {}
  } catch {
    return {}
  }
}

export function saveHabits(userId, habits) {
  const recent = Object.fromEntries(
    Object.entries(habits)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 90),
  )
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(recent))
  } catch {
    /* storage full or blocked */
  }
}

export const dayOf = (habits, iso) => ({ water: 0, minutes: 0, mood: null, ...habits[iso] })

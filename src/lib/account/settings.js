/** Household members and notification choices, kept on this device for now. */
const read = (k, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(k)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (k, v) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* storage blocked */
  }
}

export const RELATIONSHIPS = ['partner', 'child', 'parent', 'sibling', 'grandparent', 'other']
export const AGE_GROUPS = ['child', 'teen', 'adult', 'older']
export const AVOIDS = ['pork', 'beef', 'chicken', 'fish', 'shellfish', 'egg', 'dairy', 'nuts']

export const loadHousehold = (userId) => read(`ld.household.${userId}`, [])
export const saveHousehold = (userId, members) => write(`ld.household.${userId}`, members)

export function validateMember(m) {
  const errors = {}
  if (!m.name?.trim()) errors.name = 'required'
  else if (m.name.trim().length > 40) errors.name = 'long'
  if (!RELATIONSHIPS.includes(m.relationship)) errors.relationship = 'required'
  if (!AGE_GROUPS.includes(m.ageGroup)) errors.ageGroup = 'required'
  return errors
}

export const DEFAULT_NOTIFICATIONS = {
  meals: true,
  mealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  water: false,
  consultations: true, // always on: you need to know when your consultation starts
  checkIn: true,
  orders: true,
  news: false,
  channels: { push: true, sms: true, whatsapp: false, email: false },
  quietStart: '21:30',
  quietEnd: '07:00',
}

export function loadNotifications(userId) {
  const saved = read(`ld.notify.${userId}`, {})
  return {
    ...DEFAULT_NOTIFICATIONS,
    ...saved,
    mealTimes: { ...DEFAULT_NOTIFICATIONS.mealTimes, ...saved.mealTimes },
    channels: { ...DEFAULT_NOTIFICATIONS.channels, ...saved.channels },
    consultations: true,
  }
}
export const saveNotifications = (userId, value) => write(`ld.notify.${userId}`, { ...value, consultations: true })

/** At least one way to reach the person must stay on. */
export const hasChannel = (n) => Object.values(n.channels).some(Boolean)

/**
 * Professionals' own working hours and days off, saved on this device for now.
 * Booking uses these instead of the sample schedule as soon as they're saved.
 */
const key = (proId) => `ld.pro.schedule.${proId}`

export function loadSchedule(pro) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key(pro.id)))
    if (saved) return { hours: saved.hours ?? pro.schedule, daysOff: saved.daysOff ?? [] }
  } catch {
    /* fall through */
  }
  return { hours: pro.schedule, daysOff: [] }
}

export function saveSchedule(proId, { hours, daysOff }) {
  window.localStorage.setItem(key(proId), JSON.stringify({ hours, daysOff: [...new Set(daysOff)].sort() }))
}

/** The professional as booking should see them: their saved hours and days off. */
export function withSchedule(pro) {
  const { hours, daysOff } = loadSchedule(pro)
  return { ...pro, schedule: hours, daysOff }
}

/** Hours must be whole hours, start before end, within 6 AM and 10 PM. */
export function validHours(range) {
  if (!range) return true
  const [start, end] = range
  return Number.isInteger(start) && Number.isInteger(end) && start >= 6 && end <= 22 && start < end
}

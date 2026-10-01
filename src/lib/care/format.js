import { care } from '@/config/care'

/**
 * Consultation times are always shown in Lagos time (WAT), and also in the
 * person's own time when they're somewhere else (Diaspora Care).
 */
const cache = {}
const fmt = (locale, opts) => {
  const k = `${locale}|${JSON.stringify(opts)}`
  cache[k] ??= new Intl.DateTimeFormat(locale, opts)
  return cache[k]
}

export const formatTime = (iso, locale, timeZone = care.timeZone) =>
  fmt(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso))

export const formatDay = (iso, locale, timeZone = care.timeZone) =>
  fmt(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone }).format(new Date(iso))

export const formatDateChip = (dateIso, locale) => {
  const [y, m, d] = dateIso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  return {
    weekday: fmt(locale, { weekday: 'short', timeZone: 'UTC' }).format(date),
    day: d,
    month: fmt(locale, { month: 'short', timeZone: 'UTC' }).format(date),
  }
}

/** The viewer's own time zone differs from Lagos right now? */
export function viewerDiffers(iso) {
  const viewer = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!viewer || viewer === care.timeZone) return false
  const a = fmt('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: viewer }).format(new Date(iso))
  const b = fmt('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: care.timeZone }).format(new Date(iso))
  return a !== b
}

/** "today at 4:30 PM", "tomorrow at 9:00 AM" or "Friday 2 October at 11:00 AM" (Lagos time). */
export function relativeWhen(iso, locale, t, now = new Date()) {
  const day = fmt('en-CA', { timeZone: care.timeZone }).format(new Date(iso))
  const today = fmt('en-CA', { timeZone: care.timeZone }).format(now)
  const tomorrow = fmt('en-CA', { timeZone: care.timeZone }).format(new Date(now.getTime() + 864e5))
  const time = formatTime(iso, locale)
  if (day === today) return `${t('today')}, ${time}`
  if (day === tomorrow) return `${t('tomorrow')}, ${time}`
  return `${fmt(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: care.timeZone }).format(new Date(iso))}, ${time}`
}

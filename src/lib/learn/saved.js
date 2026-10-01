/**
 * Saved items and "Was this helpful?" answers, kept on this device.
 * Keys look like "article:fewer-seasoning-cubes" or "recipe:moimoi-pap".
 */
const SAVED = 'ld.learn.saved'
const FEEDBACK = 'ld.learn.feedback'

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

export const loadSaved = () => read(SAVED, [])
export function toggleSaved(key) {
  const list = loadSaved()
  const next = list.includes(key) ? list.filter((k) => k !== key) : [key, ...list]
  write(SAVED, next)
  return next
}

export const loadFeedback = (key) => read(FEEDBACK, {})[key] ?? null
export function saveFeedback(key, value) {
  write(FEEDBACK, { ...read(FEEDBACK, {}), [key]: value })
}

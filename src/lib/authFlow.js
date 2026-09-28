/**
 * Remembers where someone is in sign-in/sign-up between pages
 * (which number or email we sent a code to, and why).
 * Kept in sessionStorage so it survives a refresh but not a closed tab.
 */
const PENDING = 'ld.pendingAuth'
const PREFILL = 'ld.onboardingPrefill'

const read = (key) => {
  try {
    return JSON.parse(window.sessionStorage.getItem(key)) ?? null
  } catch {
    return null
  }
}
const write = (key, value) => {
  try {
    if (value == null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the flow still works within the page */
  }
}

export const getPending = () => read(PENDING)
export const setPending = (value) => write(PENDING, value)
export const clearPending = () => write(PENDING, null)

/** Choices made before sign-up (e.g. on the budget planner) to pre-select in "About you". */
export const getPrefill = () => read(PREFILL)
export const setPrefill = (value) => write(PREFILL, value)
export const clearPrefill = () => write(PREFILL, null)

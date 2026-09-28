// Safe localStorage access: private browsing and some webviews throw on use.
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* ignore: preference just won't persist */
    }
  },
}

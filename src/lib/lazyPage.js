import { lazy } from 'react'

const RELOAD_KEY = 'ld:chunk-reload'

// sessionStorage can throw in private browsing and some webviews
function readFlag() {
  try {
    return window.sessionStorage.getItem(RELOAD_KEY)
  } catch {
    return '1' // can't remember a reload, so don't risk a reload loop
  }
}

function writeFlag(value) {
  try {
    if (value) window.sessionStorage.setItem(RELOAD_KEY, value)
    else window.sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * React.lazy for pages, with one automatic retry.
 * A page's file can go missing after a new deploy (old tabs still ask for the
 * previous file names) or when the dev server restarted. Reloading the page
 * once fetches the current files; if that fails too, the route's error screen shows.
 */
export default function lazyPage(load) {
  return lazy(() =>
    load()
      .then((module) => {
        if (!module?.default) throw new Error('Page module loaded without a default export')
        writeFlag(null)
        return module
      })
      .catch((error) => {
        if (!readFlag()) {
          writeFlag('1')
          window.location.reload()
          return new Promise(() => {}) // wait for the reload instead of flashing an error
        }
        writeFlag(null) // let a later failure (e.g. the next deploy) retry again
        throw Object.assign(error instanceof Error ? error : new Error(String(error)), { chunkLoadFailed: true })
      }),
  )
}

/** True when an error means a page's code couldn't be downloaded. */
export function isChunkLoadError(error) {
  if (error?.chunkLoadFailed) return true
  const message = String(error?.message ?? error ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i.test(message)
}

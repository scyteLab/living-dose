import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import styles from './System.module.css'

/**
 * Shown instead of a blank screen if a page fails to load or crashes
 * (for example after an update while the app was open, or a bad connection).
 */
export default function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const chunkFailed = /dynamically imported module|Loading chunk|Failed to fetch/i.test(String(error?.message ?? error))

  if (import.meta.env.DEV) console.error(error)
  if (isRouteErrorResponse(error) && error.status === 404) return null

  return (
    <main className={styles.errorPage}>
      <img src="/favicon.svg" alt="" width="56" height="60" />
      <h1 className={styles.errorTitle}>{chunkFailed ? t('system.updateTitle') : t('system.errorTitle')}</h1>
      <p className={styles.errorBody}>{chunkFailed ? t('system.updateBody') : t('system.errorBody')}</p>
      <div className={styles.errorActions}>
        <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
          <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />
          {t('system.retry')}
        </button>
        <Link to="/" className={styles.home} reloadDocument>
          {t('system.home')}
        </Link>
      </div>
    </main>
  )
}

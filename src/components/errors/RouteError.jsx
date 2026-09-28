import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import { isChunkLoadError } from '@/lib/lazyPage'
import styles from './RouteError.module.css'

/** Which message fits the error: a missing page, a page that couldn't download, or a crash. */
function kindOf(error) {
  if (isRouteErrorResponse(error) && error.status === 404) return 'notFound'
  if (isChunkLoadError(error)) return 'stale'
  return 'crash'
}

/** Shown instead of React Router's developer error page when a route fails. */
export default function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const kind = kindOf(error)

  if (import.meta.env.DEV) console.error(error)

  return (
    <main className={styles.page}>
      <div className={styles.card} role="alert">
        <Logo showWordmark={false} size={32} />
        <h1 className={styles.title}>{t(`routeError.${kind}.title`)}</h1>
        <p className={styles.body}>{t(`routeError.${kind}.body`)}</p>
        <div className={styles.actions}>
          {kind !== 'notFound' && (
            <Button variant="action" onClick={() => window.location.reload()}>
              <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />
              {t('routeError.reload')}
            </Button>
          )}
          {/* Full page loads: the router itself may be what failed */}
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            {t('routeError.home')}
          </Button>
        </div>
        {kind === 'crash' && (
          <p className={styles.help}>
            {t('routeError.helpPrefix')} <a href="/contact">{t('routeError.helpLink')}</a>
          </p>
        )}
        {import.meta.env.DEV && kind !== 'notFound' && (
          <details className={styles.details}>
            <summary>Error details (only shown in development)</summary>
            <pre>{error?.stack ?? error?.message ?? String(error)}</pre>
          </details>
        )}
      </div>
    </main>
  )
}

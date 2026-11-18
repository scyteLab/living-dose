import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import useSync from '@/hooks/useSync'
import OfflineBanner from '@/components/system/OfflineBanner'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/navigation/Navbar'
import TabBar from '@/components/navigation/TabBar'
import Footer from '@/components/navigation/Footer'
import ReadAloud from '@/components/simple/ReadAloud'
import useAuth from '@/hooks/useAuth'
import { useSimpleView, useSimpleViewClass } from '@/lib/simple/view'
import styles from './AppShell.module.css'

export default function AppShell() {
  const { version: syncVersion } = useSync()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [simple] = useSimpleView(user?.id)
  const { pathname } = useLocation()
  useSimpleViewClass(simple)

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {t('nav.skip')}
      </a>

      <Navbar />

      <main id="main" className={styles.main}>
        <Suspense
          fallback={
            <div className={styles.loading} role="status">
              {t('common.loading')}
            </div>
          }
        >
          {/* Reloads the page's data when newer data arrives from another device */}
          <Outlet key={syncVersion} />
        </Suspense>
      </main>

      <Footer />

      <TabBar />

      {/* New pages open at the top; Back returns to where you were */}
      <OfflineBanner />
      {/* Simple view: a Read to me button on every page (Home has its own, larger one) */}
      {simple && pathname !== '/' && <ReadAloud floating />}
      <ScrollRestoration />
    </div>
  )
}

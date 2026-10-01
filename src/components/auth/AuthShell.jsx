import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import OfflineBanner from '@/components/system/OfflineBanner'
import styles from './AuthLayout.module.css'

/** Route wrapper for the sign-in pages: no site navigation, just the page. */
export default function AuthShell() {
  return (
    <>
      <Suspense fallback={<div className={styles.loading} role="status" aria-label="Loading" />}>
        <Outlet />
      </Suspense>
      <OfflineBanner />
      <ScrollRestoration />
    </>
  )
}

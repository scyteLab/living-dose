import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ClipboardCheck, FileClock, Flag, LayoutDashboard, Package, Video } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import { isDemo, updateProfile } from '@/lib/auth'
import { isStaff } from '@/lib/staff/access'
import styles from './Staff.module.css'

const NAV = [
  { to: '/staff', id: 'overview', icon: LayoutDashboard, end: true },
  { to: '/staff/orders', id: 'orders', icon: Package },
  { to: '/staff/appointments', id: 'appointments', icon: Video },
  { to: '/staff/moderation', id: 'moderation', icon: Flag },
  { to: '/staff/content', id: 'content', icon: ClipboardCheck },
  { to: '/staff/activity', id: 'activity', icon: FileClock },
]

/** Shell for /staff: only staff get past the gate. */
export default function StaffLayout() {
  const { t } = useTranslation('staff')
  const { user, firstName } = useAuth()

  if (!isStaff(user)) {
    return (
      <main className={styles.gate}>
        <Logo size={24} />
        <h1 className={styles.gateTitle}>{t('gate.title')}</h1>
        <p className={styles.muted}>{t('gate.body')}</p>
        <p className={styles.gateNote}>{isDemo ? t('gate.demo') : t('gate.live')}</p>
        <div className={styles.gateActions}>
          {isDemo && <Button onClick={() => updateProfile(user, { demoStaff: true })}>{t('gate.enableDemo')}</Button>}
          <Button to="/" variant="outline">
            {t('gate.home')}
          </Button>
        </div>
      </main>
    )
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/staff" className={styles.brand} aria-label={t('title')}>
          <Logo size={20} />
          <span className={styles.brandTag}>{t('title')}</span>
        </Link>
        <nav aria-label={t('nav.label')} className={styles.nav}>
          {NAV.map(({ to, id, icon: Icon, end }) => (
            <NavLink key={id} to={to} end={end} className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              {t(`nav.${id}`)}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <p className={styles.small}>{t('signedInAs', { name: firstName || user.phone || user.email })}</p>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            {t('backToSite')}
          </Link>
        </div>
      </aside>
      <main className={styles.main} id="main">
        {isDemo && <p className={styles.demo}>{t('demoBanner')}</p>}
        <Suspense fallback={<div className={styles.loading} role="status" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

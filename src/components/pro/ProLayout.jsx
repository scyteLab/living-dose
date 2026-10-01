import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Avatar from '@/components/care/Avatar'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import { PROFESSIONALS } from '@/data/professionals'
import useAuth from '@/hooks/useAuth'
import { isDemo, updateProfile } from '@/lib/auth'
import { professionalFor } from '@/lib/pro/access'

/** Shell for /pro: only professionals get past the gate. */
export default function ProLayout() {
  const { t } = useTranslation('pro')
  const { user } = useAuth()
  const pro = professionalFor(user)
  const [pick, setPick] = useState(PROFESSIONALS[0].id)

  if (!pro) {
    return (
      <main className={styles.gate}>
        <Logo size={24} />
        <h1 className={styles.gateTitle}>{t('gate.title')}</h1>
        <p className={styles.muted}>{t('gate.body')}</p>
        <p className={styles.gateNote}>{isDemo ? t('gate.demo') : t('gate.live')}</p>
        {isDemo && (
          <label className={styles.pick}>
            <span>{t('gate.pick')}</span>
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              {PROFESSIONALS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}, {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={styles.gateActions}>
          {isDemo && <Button onClick={() => updateProfile(user, { demoPro: pick })}>{t('gate.start')}</Button>}
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
        <Link to="/pro" className={styles.brand} aria-label={t('title')}>
          <Logo size={20} />
          <span className={clsx(styles.brandTag, styles.brandPro)}>{t('title')}</span>
        </Link>
        <div className={styles.proCard}>
          <Avatar professional={pro} size="sm" />
          <div>
            <p className={styles.proName}>{pro.name}</p>
            <p className={styles.small}>{pro.title}</p>
          </div>
        </div>
        <nav aria-label={t('nav.label')} className={styles.nav}>
          <NavLink to="/pro" end className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
            <CalendarDays size={19} strokeWidth={2} aria-hidden="true" />
            {t('nav.schedule')}
          </NavLink>
          <NavLink to="/pro/availability" className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
            <Clock size={19} strokeWidth={2} aria-hidden="true" />
            {t('nav.availability')}
          </NavLink>
        </nav>
        <div className={styles.sideFoot}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            {t('backToSite')}
          </Link>
        </div>
      </aside>
      <main className={styles.main} id="main">
        {isDemo && <p className={styles.demo}>{t('demoBanner')}</p>}
        <Suspense fallback={<div className={styles.loading} role="status" />}>
          <Outlet context={pro} />
        </Suspense>
      </main>
    </div>
  )
}

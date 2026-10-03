import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BarChart3, Building2, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import { ORGANISATIONS } from '@/data/organisations'
import useAuth from '@/hooks/useAuth'
import { isDemo, updateProfile } from '@/lib/auth'
import { organisationFor } from '@/lib/org/access'

/** Shell for /org: only an organisation's administrators get past the gate. */
export default function OrgLayout() {
  const { t } = useTranslation('org')
  const { user } = useAuth()
  const org = organisationFor(user)
  const [pick, setPick] = useState(ORGANISATIONS[0].id)
  const [sample, setSample] = useState(isDemo)

  if (!org) {
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
              {ORGANISATIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={styles.gateActions}>
          {isDemo ? (
            <Button onClick={() => updateProfile(user, { demoOrg: pick })}>{t('gate.start')}</Button>
          ) : (
            <Button to="/partners">{t('gate.partner')}</Button>
          )}
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
        <Link to="/org" className={styles.brand} aria-label={t('title')}>
          <Logo size={20} />
          <span className={clsx(styles.brandTag, styles.brandOrg)}>{t('title')}</span>
        </Link>
        <div className={styles.proCard}>
          <span className={styles.orgIcon} aria-hidden="true">
            <Building2 size={20} strokeWidth={2} />
          </span>
          <div>
            <p className={styles.proName}>{org.name}</p>
            <p className={styles.small}>{t(`sectors.${org.sector}`)}</p>
          </div>
        </div>
        <nav aria-label={t('nav.label')} className={styles.nav}>
          <NavLink to="/org" end className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
            <BarChart3 size={19} strokeWidth={2} aria-hidden="true" />
            {t('nav.overview')}
          </NavLink>
          <NavLink to="/org/invite" className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
            <UserPlus size={19} strokeWidth={2} aria-hidden="true" />
            {t('nav.invite')}
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
        {isDemo && (
          <div className={styles.demo}>
            <label className={styles.sampleToggle}>
              <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} />
              {t('sample.label')}
            </label>
            {sample && <span> · {t('sample.note')}</span>}
          </div>
        )}
        <Suspense fallback={<div className={styles.loading} role="status" />}>
          <Outlet context={{ org, sample: isDemo && sample }} />
        </Suspense>
      </main>
    </div>
  )
}

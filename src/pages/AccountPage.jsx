import { NavLink, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Building2, LayoutDashboard, Lock, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import OrganisationSection from '@/components/account/OrganisationSection'
import { isStaff } from '@/lib/staff/access'
import clsx from 'clsx'
import HouseholdSection from '@/components/account/HouseholdSection'
import NotificationsSection from '@/components/account/NotificationsSection'
import PrivacySection from '@/components/account/PrivacySection'
import ProfileSection from '@/components/account/ProfileSection'
import SecuritySection from '@/components/account/SecuritySection'
import styles from '@/components/account/Account.module.css'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'

const SECTIONS = [
  { id: 'profile', icon: UserRound, Component: ProfileSection },
  { id: 'household', icon: UsersRound, Component: HouseholdSection },
  { id: 'notifications', icon: Bell, Component: NotificationsSection },
  { id: 'organisation', icon: Building2, Component: OrganisationSection },
  { id: 'privacy', icon: ShieldCheck, Component: PrivacySection },
  { id: 'security', icon: Lock, Component: SecuritySection },
]

/** /account/:section, one page per section so each can be linked to directly. */
export default function AccountPage() {
  const { section = 'profile' } = useParams()
  const { t } = useTranslation('account')
  const { user } = useAuth()
  const current = SECTIONS.find((s) => s.id === section)
  useDocumentTitle(current ? `${t(`nav.${current.id}`)} · ${t('docTitle')}` : t('docTitle'))

  if (!current) return <Navigate to="/account" replace />
  const { Component } = current

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.intro}>{t('intro')}</p>
      </header>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label={t('nav.label')}>
          {SECTIONS.map(({ id, icon: Icon }) => (
            <NavLink key={id} to={id === 'profile' ? '/account' : `/account/${id}`} end className={({ isActive }) => clsx(styles.navLink, isActive && styles.navOn)}>
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              {t(`nav.${id}`)}
            </NavLink>
          ))}
          {isStaff(user) && (
            <NavLink to="/staff" className={styles.navLink}>
              <LayoutDashboard size={19} strokeWidth={2} aria-hidden="true" />
              {t('staffConsole')}
            </NavLink>
          )}
        </nav>
        {/* key resets each section's form when switching */}
        <Component key={`${current.id}-${user.id}`} user={user} />
      </div>
    </div>
  )
}

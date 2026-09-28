import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { tabNav } from '@/config/navigation'
import styles from './TabBar.module.css'

/** Bottom tab bar for phones, with the raised "Snap your plate" button. */
export default function TabBar() {
  const { t } = useTranslation()

  return (
    <nav className={styles.tabbar} aria-label={t('nav.main')}>
      {tabNav.map(({ key, path, icon: Icon, tone, featured }) =>
        featured ? (
          <NavLink key={key} to={path} className={styles.fab} aria-label={t(`nav.${key}`)}>
            <Icon size={26} strokeWidth={2} aria-hidden="true" />
          </NavLink>
        ) : (
          <NavLink
            key={key}
            to={path}
            end={path === '/'}
            className={({ isActive }) => clsx(styles.tab, isActive && styles[`active_${tone}`])}
          >
            <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
            <span>{t(`nav.${key}`)}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}

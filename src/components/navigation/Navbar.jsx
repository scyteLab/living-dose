import { useCallback, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import useScrolled from '@/hooks/useScrolled'
import useAuth from '@/hooks/useAuth'
import { siteNav } from '@/config/navigation'
import RegionMenu from './RegionMenu'
import MobileMenu from './MobileMenu'
import styles from './Navbar.module.css'

/**
 * Site navigation.
 *  - 1100px and up: logo, centred links, region, sign in, join.
 *  - Below 1100px: logo, join, and a menu button that opens <MobileMenu>.
 * Gains a frosted background and hairline once the page scrolls.
 */
export default function Navbar() {
  const { t } = useTranslation()
  const scrolled = useScrolled(8)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const { user, firstName, signOut } = useAuth()
  const displayName = firstName || t('nav.account')

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  return (
    <>
      <header className={clsx(styles.bar, scrolled && styles.scrolled)}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand} aria-label={t('nav.homeLink')}>
            <Logo />
          </Link>

          <nav className={styles.links} aria-label={t('nav.main')}>
            <ul className={styles.list}>
              {siteNav.map(({ key, path, tone }) => (
                <li key={key}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) => clsx(styles.link, isActive && styles[`active_${tone}`])}
                  >
                    {t(`nav.${key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <RegionMenu className={styles.desktopOnly} />
            {user ? (
              <>
                <Link to="/welcome" className={styles.account} aria-label={t('nav.signedInAs', { name: displayName })}>
                  <span className={styles.avatar} aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.accountName}>{displayName}</span>
                </Link>
                <button type="button" className={clsx(styles.signIn, styles.desktopOnly, styles.signOut)} onClick={signOut}>
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className={clsx(styles.signIn, styles.desktopOnly)}>
                  {t('common.signIn')}
                </Link>
                <Button to="/join" size="sm">
                  {t('common.joinFree')}
                </Button>
              </>
            )}
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={t('nav.openMenu')}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu id="site-menu" open={menuOpen} onClose={closeMenu} />
    </>
  )
}

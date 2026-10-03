import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Globe, X } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import useRegion from '@/hooks/useRegion'
import useAuth from '@/hooks/useAuth'
import { siteNav, languages } from '@/config/navigation'
import RegionOptions from './RegionOptions'
import styles from './MobileMenu.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), summary, input:not([disabled])'

/**
 * Slide-in menu for tablets and phones.
 * Stays mounted so it can animate; `inert` removes it from focus and
 * screen readers while closed. Focus is trapped inside while open.
 */
export default function MobileMenu({ id, open, onClose }) {
  const { t } = useTranslation()
  const { region, language } = useRegion()
  const { user, signOut } = useAuth()
  const panelRef = useRef(null)
  const regionName = t(`regions.${region}`)
  const languageName = languages.find((l) => l.code === language)?.label ?? 'English'

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel?.querySelector('[data-autofocus]')?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      const first = items.at(0)
      const last = items.at(-1)
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <div className={clsx(styles.root, open && styles.open)} inert={!open}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div ref={panelRef} id={id} className={styles.panel} role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
        <div className={styles.head}>
          <Logo size={24} />
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('nav.closeMenu')} data-autofocus>
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t('nav.main')}>
          <ul className={styles.list}>
            {siteNav.map(({ key, path, icon: Icon, tone }) => (
              <li key={key}>
                <NavLink to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
                  <span className={clsx(styles.badge, styles[tone])} aria-hidden="true">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className={styles.linkText}>{t(`nav.${key}`)}</span>
                  <ChevronRight className={styles.arrow} size={18} strokeWidth={2} aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <details className={styles.region}>
          <summary className={styles.summary}>
            <span className={styles.summaryIcon} aria-hidden="true">
              <Globe size={20} strokeWidth={1.8} />
            </span>
            <span className={styles.summaryText}>
              <span className={styles.summaryLabel}>{t('region.title')}</span>
              <span className={styles.summaryValue}>
                {regionName}, {languageName}
              </span>
            </span>
            <ChevronDown className={styles.summaryChevron} size={18} strokeWidth={2} aria-hidden="true" />
          </summary>
          <div className={styles.regionBody}>
            <RegionOptions idPrefix="drawer" />
          </div>
        </details>

        <div className={styles.footer}>
          {user ? (
            <>
              <Button to="/account" className={styles.full} onClick={onClose}>
                {t('nav.account')}
              </Button>
              <Button
                variant="outline"
                className={styles.full}
                onClick={() => {
                  signOut()
                  onClose()
                }}
              >
                {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button to="/sign-in" variant="outline" className={styles.full} onClick={onClose}>
                {t('common.signIn')}
              </Button>
              <Button to="/join" className={styles.full} onClick={onClose}>
                {t('common.joinFree')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

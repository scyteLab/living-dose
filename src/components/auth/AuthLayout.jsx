import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BadgeCheck, CircleHelp, Heart, ShieldCheck } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import DemoNotice from './DemoNotice'
import styles from './AuthLayout.module.css'

/** The "Private and secure · Registered experts · Free to join" line at the bottom of the panel. */
export function TrustRow() {
  const { t } = useTranslation('auth')
  return (
    <ul className={styles.trust}>
      <li>
        <ShieldCheck size={18} strokeWidth={2} className={styles.trustLeaf} aria-hidden="true" />
        {t('panel.trustPrivate')}
      </li>
      <li>
        <BadgeCheck size={18} strokeWidth={2} className={styles.trustSky} aria-hidden="true" />
        {t('panel.trustExperts')}
      </li>
      <li>
        <Heart size={18} strokeWidth={2} className={styles.trustEmber} aria-hidden="true" />
        {t('panel.trustFree')}
      </li>
    </ul>
  )
}

/**
 * Split layout for sign-in pages.
 * Left (desktop only): dark brand panel with a headline and a visual.
 * Right: back link, the form, and an optional footer line.
 * `mobileIntro` shows a compact dark header on phones instead of the panel.
 */
export default function AuthLayout({ panel, back = { to: '/', label: null }, mobileIntro, footer, width = 'md', children }) {
  const { t } = useTranslation('auth')

  return (
    <div className={styles.page}>
      <aside className={styles.panel} aria-hidden={panel.decorative ? 'true' : undefined}>
        <div className={styles.shapes} aria-hidden="true">
          <span className={styles.shapeLeaf} />
          <span className={styles.shapeEmber} />
          <span className={styles.shapeSky} />
        </div>
        <Link to="/" className={styles.panelLogo} aria-label={t('homeLink')}>
          <Logo inverse />
        </Link>
        <div className={styles.panelCopy}>
          <p className={styles.panelTitle}>{panel.title}</p>
          <p className={styles.panelSub}>{panel.sub}</p>
        </div>
        <div className={styles.panelVisual}>{panel.visual}</div>
        <div className={styles.panelBottom}>{panel.bottom ?? <TrustRow />}</div>
      </aside>

      <div className={styles.main}>
        <div className={styles.top}>
          <Link to={back.to} className={styles.back}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
            <span>{back.label ?? t('backHome')}</span>
          </Link>
          <Link to="/" className={styles.mobileLogo} aria-label={t('homeLink')}>
            <Logo showWordmark={false} size={22} />
          </Link>
          <Link to="/contact" className={styles.help}>
            <CircleHelp size={18} strokeWidth={2} aria-hidden="true" />
            <span className={styles.helpText}>{t('help')}</span>
          </Link>
        </div>

        <main className={styles.center}>
          <div className={`${styles.content} ${styles[width]}`}>
            {mobileIntro && <div className={styles.mobileIntro}>{mobileIntro}</div>}
            <DemoNotice />
            {children}
          </div>
        </main>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

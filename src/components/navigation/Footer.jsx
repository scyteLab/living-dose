import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/brand/Logo'
import styles from './Footer.module.css'

const COLUMNS = [
  {
    key: 'product',
    links: [
      { key: 'shop', to: '/shop' },
      { key: 'plans', to: '/plan' },
      { key: 'care', to: '/care' },
      { key: 'community', to: '/community' },
      { key: 'learn', to: '/learn' },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'about', to: '/about' },
      { key: 'partners', to: '/partners' },
      { key: 'contact', to: '/contact' },
    ],
  },
  {
    key: 'help',
    links: [
      { key: 'faq', to: '/faq' },
      { key: 'terms', to: '/terms' },
      { key: 'privacy', to: '/privacy' },
    ],
  },
]

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logoLink} aria-label={t('nav.homeLink')}>
            <Logo inverse />
          </Link>
          <p className={styles.tagline}>{t('brand.tagline')}.</p>
          <p className={styles.mission}>{t('footer.mission')}</p>
        </div>

        <nav className={styles.columns} aria-label={t('footer.label')}>
          {COLUMNS.map((col) => (
            <div key={col.key} className={styles.column}>
              <h2 className={styles.heading}>{t(`footer.${col.key}.title`)}</h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link to={link.to} className={styles.link}>
                      {t(`footer.${col.key}.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>{t('footer.copyright', { year })}</p>
        <p className={styles.made}>{t('footer.made')}</p>
      </div>
    </footer>
  )
}

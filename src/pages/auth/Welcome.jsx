import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ClipboardPlus, ShoppingBag, Video } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import styles from './Welcome.module.css'

const NEXT = [
  { key: 'check', icon: ClipboardPlus, tone: 'ember', to: '/plan', featured: true },
  { key: 'shop', icon: ShoppingBag, tone: 'leaf', to: '/shop' },
  { key: 'care', icon: Video, tone: 'sky', to: '/care' },
]

export default function Welcome() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('welcome.docTitle'))
  const { firstName } = useAuth()

  return (
    <div className={styles.page}>
      <span className={clsx(styles.bg, styles.bgLeaf)} aria-hidden="true" />
      <span className={clsx(styles.bg, styles.bgEmber)} aria-hidden="true" />
      <span className={clsx(styles.bg, styles.bgSky)} aria-hidden="true" />

      <header className={styles.top}>
        <Link to="/" aria-label={t('homeLink')}>
          <Logo />
        </Link>
        <Link to="/" className={styles.home}>
          {t('welcome.goHome')}
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.mark} aria-hidden="true">
          <span className={styles.markLeaf} />
          <span className={styles.markEmber} />
          <span className={styles.markSky} />
        </div>

        <div className={styles.copy}>
          <h1 className={styles.title}>
            {firstName ? t('welcome.titleNamed', { name: firstName }) : t('welcome.title')}
          </h1>
          <p className={styles.sub}>{t('welcome.sub')}</p>
        </div>

        <ol className={styles.list}>
          {NEXT.map(({ key, icon: Icon, tone, to, featured }, i) => (
            <li key={key} style={{ '--delay': `${500 + i * 120}ms` }} className={styles.item}>
              <Link to={to} className={clsx(styles.card, featured && styles.featured)}>
                <span className={clsx(styles.icon, styles[tone])} aria-hidden="true">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <span className={styles.cardText}>
                  <span className={styles.cardTitle}>{t(`welcome.next.${key}.title`)}</span>
                  <span className={styles.cardBody}>{t(`welcome.next.${key}.body`)}</span>
                </span>
                {featured && <span className={styles.badge}>{t('welcome.startHere')}</span>}
                <ArrowRight className={styles.arrow} size={20} strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}

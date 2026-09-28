import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import HeroVisual from './HeroVisual'
import styles from './Hero.module.css'

/**
 * Landing hero. One orchestrated entrance: the copy rises in line by line
 * while the cards on the right pop in and the score ring fills.
 */
export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <p className={clsx(styles.badge, 'motion-rise')}>
          <span className={styles.dots} aria-hidden="true">
            <span className={clsx(styles.dot, styles.dotLeaf, 'motion-pulse')} />
            <span className={clsx(styles.dot, styles.dotEmber, 'motion-pulse')} style={{ '--pulse-delay': '0.8s' }} />
            <span className={clsx(styles.dot, styles.dotSky, 'motion-pulse')} style={{ '--pulse-delay': '1.6s' }} />
          </span>
          {t('landing.hero.badge')}
        </p>

        <h1 id="hero-title" className={clsx(styles.title, 'motion-rise')} style={{ '--delay': '80ms' }}>
          {t('landing.hero.title')}
        </h1>

        <p className={clsx(styles.body, 'motion-rise')} style={{ '--delay': '160ms' }}>
          {t('landing.hero.body')}
        </p>

        <p className={clsx(styles.tagline, 'motion-rise')} style={{ '--delay': '200ms' }}>
          {t('brand.tagline')}.
        </p>

        <div className={clsx(styles.ctas, 'motion-rise')} style={{ '--delay': '260ms' }}>
          <Button to="/join" variant="action">
            {t('landing.hero.ctaPrimary')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button to="/shop" variant="outline">
            {t('landing.hero.ctaSecondary')}
          </Button>
        </div>

        <ul className={clsx(styles.trust, 'motion-rise')} style={{ '--delay': '340ms' }}>
          <li>
            <ShieldCheck className={styles.trustIconLeaf} size={18} strokeWidth={2} aria-hidden="true" />
            {t('landing.hero.trustDietitians')}
          </li>
          <li>
            <BadgeCheck className={styles.trustIconSky} size={18} strokeWidth={2} aria-hidden="true" />
            {t('landing.hero.trustFree')}
          </li>
        </ul>
      </div>

      <HeroVisual />
    </section>
  )
}

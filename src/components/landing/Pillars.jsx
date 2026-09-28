import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, HeartPulse, LineChart, ShoppingBag, Sprout } from 'lucide-react'
import clsx from 'clsx'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Pillars.module.css'

const PILLARS = [
  { key: 'food', icon: ShoppingBag, tone: 'leaf', to: '/shop' },
  { key: 'nutrition', icon: Sprout, tone: 'ember', to: '/plan' },
  { key: 'care', icon: HeartPulse, tone: 'sky', to: '/care' },
  { key: 'track', icon: LineChart, tone: 'plum', to: '/join' },
]

/** The four things Living Dose does, one card each, in the brand colours. */
export default function Pillars() {
  const { t } = useTranslation()

  return (
    <section className={styles.section} aria-labelledby="pillars-title">
      <Reveal className={styles.head}>
        <SectionHeader id="pillars-title" title={t('landing.pillars.title')} />
        <p className={styles.lead}>{t('landing.pillars.intro')}</p>
      </Reveal>

      <ul className={styles.grid}>
        {PILLARS.map(({ key, icon: Icon, tone, to }, i) => (
          <Reveal as="li" key={key} delay={i * 90} className={clsx(styles.card, styles[tone])}>
            <span className={styles.icon} aria-hidden="true">
              <Icon size={26} strokeWidth={1.8} />
            </span>
            <h3 className={styles.cardTitle}>{t(`landing.pillars.${key}.title`)}</h3>
            <p className={styles.cardBody}>{t(`landing.pillars.${key}.body`)}</p>
            <Link to={to} className={styles.link}>
              {t(`landing.pillars.${key}.link`)}
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

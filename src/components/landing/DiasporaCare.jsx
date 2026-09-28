import { useTranslation } from 'react-i18next'
import { Check, Clock } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './DiasporaCare.module.css'

const PLACES = ['uk', 'us', 'canada', 'europe', 'gulf']
const UPDATES = [
  { key: 'bp', done: true },
  { key: 'meals', done: true },
  { key: 'call', done: false },
]

/** Care for loved ones at home, from abroad. */
export default function DiasporaCare() {
  const { t } = useTranslation()

  return (
    <section className={styles.band} aria-labelledby="diaspora-title">
      <Reveal className={styles.copy}>
        <SectionHeader
          id="diaspora-title"
          eyebrow={t('landing.diaspora.eyebrow')}
          tone="sky"
          title={t('landing.diaspora.title')}
          intro={t('landing.diaspora.intro')}
        />
        <div className={styles.places}>
          <p className={styles.placesLabel}>{t('landing.diaspora.placesLabel')}</p>
          <ul className={styles.chips}>
            {PLACES.map((p) => (
              <li key={p}>{t(`landing.diaspora.places.${p}`)}</li>
            ))}
          </ul>
        </div>
        <Button to="/join?for=family" variant="care">
          {t('landing.diaspora.cta')}
        </Button>
      </Reveal>

      <Reveal delay={120} className={styles.card} aria-label={t('landing.diaspora.cardLabel')} role="group">
        <div className={styles.person}>
          <span className={styles.avatar} aria-hidden="true">
            M
          </span>
          <div className={styles.who}>
            <p className={styles.name}>{t('landing.diaspora.person')}</p>
            <p className={styles.where}>{t('landing.diaspora.where')}</p>
          </div>
          <span className={styles.status}>{t('landing.diaspora.status')}</span>
        </div>

        <ul className={styles.updates}>
          {UPDATES.map(({ key, done }) => (
            <li key={key} className={clsx(styles.update, done ? styles.done : styles.next)}>
              <span className={styles.mark} aria-hidden="true">
                {done ? <Check size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={2.4} />}
              </span>
              <span className={styles.updateText}>{t(`landing.diaspora.updates.${key}.title`)}</span>
              <span className={styles.updateWhen}>{t(`landing.diaspora.updates.${key}.when`)}</span>
            </li>
          ))}
        </ul>

        <p className={styles.report}>{t('landing.diaspora.report')}</p>
      </Reveal>
    </section>
  )
}

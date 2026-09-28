import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './HowItWorks.module.css'

const STEPS = [
  { key: 'assess', tone: 'leaf' },
  { key: 'plan', tone: 'ember' },
  { key: 'eat', tone: 'leaf' },
  { key: 'track', tone: 'sun' },
  { key: 'support', tone: 'sky' },
  { key: 'improve', tone: 'leaf' },
]

/** The core loop on a dark band: six steps that feed each other. */
export default function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section className={styles.band} aria-labelledby="loop-title">
      <Reveal className={styles.head}>
        <SectionHeader id="loop-title" inverse title={t('landing.loop.title')} />
        <p className={styles.lead}>{t('landing.loop.intro')}</p>
      </Reveal>

      <ol className={styles.steps}>
        {STEPS.map(({ key, tone }, i) => (
          <Reveal as="li" key={key} delay={i * 80} className={clsx(styles.step, styles[tone])}>
            <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className={styles.stepTitle}>{t(`landing.loop.${key}.title`)}</h3>
            <p className={styles.stepBody}>{t(`landing.loop.${key}.body`)}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

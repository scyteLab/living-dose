import { useTranslation } from 'react-i18next'
import { QrCode } from 'lucide-react'
import clsx from 'clsx'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Traceability.module.css'

const STEPS = ['harvested', 'checked', 'delivered']

/** Farm-to-door traceability: scan a code, see the journey. */
export default function Traceability() {
  const { t } = useTranslation()

  return (
    <section className={styles.section} aria-labelledby="trace-title">
      <Reveal className={styles.card} role="group" aria-label={t('landing.trace.cardLabel')}>
        <div className={styles.qr} aria-hidden="true">
          <QrCode size={72} strokeWidth={1.3} />
          <span className={styles.scan} />
        </div>

        <div className={styles.details}>
          <div>
            <p className={styles.product}>{t('landing.trace.product')}</p>
            <p className={styles.batch}>{t('landing.trace.batch')}</p>
          </div>

          <ol className={styles.journey}>
            {STEPS.map((step, i) => (
              <li key={step} className={clsx(styles.stop, i === STEPS.length - 1 && styles.last)}>
                <span className={styles.stopTitle}>{t(`landing.trace.steps.${step}.title`)}</span>
                <span className={styles.stopWhere}>{t(`landing.trace.steps.${step}.where`)}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal delay={120} className={styles.copy}>
        <SectionHeader
          id="trace-title"
          eyebrow={t('landing.trace.eyebrow')}
          title={t('landing.trace.title')}
          intro={t('landing.trace.intro')}
        />
        <ul className={styles.points}>
          <li>{t('landing.trace.points.fresh')}</li>
          <li>{t('landing.trace.points.farmers')}</li>
          <li>{t('landing.trace.points.safe')}</li>
        </ul>
      </Reveal>
    </section>
  )
}

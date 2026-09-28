import { useTranslation } from 'react-i18next'
import { Building2, Check, Sprout, Stethoscope } from 'lucide-react'
import clsx from 'clsx'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import styles from './Partners.module.css'

const TRACKS = [
  { key: 'professionals', icon: Stethoscope, tone: 'sky', variant: 'care' },
  { key: 'farmers', icon: Sprout, tone: 'leaf', variant: 'primary' },
  { key: 'organisations', icon: Building2, tone: 'ember', variant: 'action' },
]
const STEPS = ['tell', 'meet', 'start']

export default function Partners() {
  const { t } = useTranslation()
  useDocumentTitle(t('partnersPage.docTitle'))

  return (
    <div className={styles.page}>
      <PageIntro eyebrow={t('partnersPage.eyebrow')} title={t('partnersPage.title')} intro={t('partnersPage.intro')} />

      <ul className={styles.tracks}>
        {TRACKS.map(({ key, icon: Icon, tone, variant }, i) => {
          const points = t(`partnersPage.tracks.${key}.points`, { returnObjects: true })
          return (
            <Reveal as="li" key={key} delay={i * 90} className={clsx(styles.track, styles[tone])}>
              <span className={styles.icon} aria-hidden="true">
                <Icon size={26} strokeWidth={1.8} />
              </span>
              <h2 className={styles.trackTitle}>{t(`partnersPage.tracks.${key}.title`)}</h2>
              <p className={styles.for}>{t(`partnersPage.tracks.${key}.for`)}</p>
              <ul className={styles.points}>
                {points.map((point) => (
                  <li key={point}>
                    <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <Button to={`/contact?topic=partnership`} variant={variant} className={styles.cta}>
                {t(`partnersPage.tracks.${key}.cta`)}
              </Button>
            </Reveal>
          )
        })}
      </ul>

      <section className={styles.how} aria-labelledby="how-title">
        <Reveal>
          <SectionHeader id="how-title" title={t('partnersPage.stepsTitle')} />
        </Reveal>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step} delay={i * 90} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <h3 className={styles.stepTitle}>{t(`partnersPage.steps.${step}.title`)}</h3>
              <p className={styles.stepBody}>{t(`partnersPage.steps.${step}.body`)}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  )
}

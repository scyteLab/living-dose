import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Hospital, PhoneCall, TriangleAlert } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useHealthCheck from '@/hooks/useHealthCheck'
import { isBpCrisis } from '@/lib/healthCheck/scoring'
import { site } from '@/config/site'
import styles from './HealthCheckSafety.module.css'

/** Shown when blood pressure is 180/110 or higher, before any results. */
export default function HealthCheckSafety() {
  const { t } = useTranslation('healthCheck')
  useDocumentTitle(t('safety.docTitle'))
  const { answers } = useHealthCheck()
  const h = answers.history

  if (!isBpCrisis(h)) return <Navigate to="/health-check/history" replace />

  const signs = t('safety.signs', { returnObjects: true })

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" aria-label="Living Dose home">
          <Logo size={22} />
        </Link>
      </header>
      <main className={styles.main}>
        <section role="alert" className={styles.card} aria-labelledby="safety-title">
          <span className={styles.icon} aria-hidden="true">
            <TriangleAlert size={32} strokeWidth={2} />
          </span>
          <div className={styles.head}>
            <h1 id="safety-title" className={styles.title}>
              {t('safety.title')}
            </h1>
            <p className={styles.lead}>{t('safety.body', { bp: `${h.systolic}/${h.diastolic}` })}</p>
          </div>
          <div className={styles.signs}>
            <p className={styles.signsIntro}>{t('safety.signsIntro')}</p>
            <ul>
              {signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.actions}>
            <a href={`tel:${site.emergencyNumber}`} className={styles.call}>
              <PhoneCall size={20} strokeWidth={2} aria-hidden="true" />
              {t('safety.call')}
            </a>
            <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noreferrer" className={styles.hospital}>
              <Hospital size={20} strokeWidth={2} aria-hidden="true" />
              {t('safety.hospital')}
            </a>
          </div>
          <div className={styles.footer}>
            <p>{t('safety.recheck')}</p>
            <p>
              {t('safety.saved')} <Link to="/health-check/history">{t('safety.typo')}</Link>
            </p>
            <Link to="/health-check/calculating" className={styles.continue}>
              {t('safety.continue')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

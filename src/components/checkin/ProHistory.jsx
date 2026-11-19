import { useTranslation } from 'react-i18next'
import { CircleAlert } from 'lucide-react'
import staff from '@/components/staff/Staff.module.css'
import { isUrgent } from '@/lib/checkin/checkins'
import { FEELING_EMOJI, ScoreChart } from './parts'
import styles from './Checkin.module.css'
import { formatLocale } from '@/i18n'

/** For doctors: the member's Living Score over time and recent daily check-ins (shared only). */
export default function ProHistory({ checkins = [], scores = [] }) {
  const { t, i18n } = useTranslation('checkin')
  const tp = useTranslation('pro').t
  const fmt = new Intl.DateTimeFormat(formatLocale(i18n.language), { day: 'numeric', month: 'short' })
  const readings = checkins.filter((c) => c.bp || c.sugar != null)
  const unwellDays = checkins.filter((c) => ['unwell', 'bad'].includes(c.feeling)).length

  return (
    <section className={staff.panel}>
      <h2 className={staff.dayTitle}>{tp('consult.history')}</h2>
      {scores.length > 0 && (
        <>
          <p className={staff.label}>{t('scores.title')}</p>
          <ScoreChart points={scores} />
        </>
      )}
      {checkins.length === 0 ? (
        <p className={staff.muted}>{tp('consult.noCheckins')}</p>
      ) : (
        <>
          <p className={staff.small}>{tp('consult.checkinSummary', { count: checkins.length, unwell: unwellDays, readings: readings.length })}</p>
          <ul className={styles.recent}>
            {checkins.slice(0, 14).map((c) => (
              <li key={c.date}>
                <span className={styles.recentEmoji} aria-hidden="true">
                  {isUrgent(c) ? <CircleAlert size={22} strokeWidth={2.2} color="var(--berry)" /> : FEELING_EMOJI[c.feeling]}
                </span>
                <span className={styles.recentDate}>
                  {fmt.format(new Date(`${c.date}T12:00:00`))} · {t(`feelings.${c.feeling}`)}
                </span>
                <span className={styles.small}>
                  {[
                    c.sleep && `${t('sleepQ').replace(/\?$/, '')}: ${t(`sleepOptions.${c.sleep}`)}`,
                    c.symptoms.length > 0 && c.symptoms.map((s) => t(`symptoms.${s}`)).join(', '),
                    c.bp && `BP ${c.bp.systolic}/${c.bp.diastolic}`,
                    c.sugar != null && `${t('sugar').replace(/\s*\(.*\)/, '')} ${c.sugar} mg/dL`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

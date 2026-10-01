import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import ScoreRing from '@/components/ui/ScoreRing'
import { BAND_COLOUR } from '@/lib/healthCheck/display'
import styles from './Dashboard.module.css'

const FOUR_WEEKS = 28 * 864e5

export default function ScoreCard({ record, now }) {
  const { t } = useTranslation('dashboard')
  const tc = useTranslation('healthCheck').t
  const { score, band, pillars, measures: m } = record.results
  const weak = Object.entries(pillars)
    .filter(([, v]) => v != null)
    .sort(([, a], [, b]) => a - b)[0]?.[0]
  const daysLeft = Math.ceil((new Date(record.createdAt).getTime() + FOUR_WEEKS - now) / 864e5)
  const elapsed = Math.min(100, Math.max(3, 100 - (daysLeft / 28) * 100))

  return (
    <section className={styles.score} aria-labelledby="score-h">
      <div className={styles.scoreHead}>
        <h2 id="score-h" className={styles.scoreTitle}>
          {t('score.title')}
        </h2>
        <span className={styles.band} style={{ background: BAND_COLOUR[band] }}>
          {tc(`results.bands.${band}`)}
        </span>
      </div>
      <div className={styles.scoreRow}>
        <ScoreRing value={score} size={140} stroke={11} className={styles.ring} />
        <div className={styles.scoreText}>
          <p>{t(`score.summary.${band}`, { weak: tc(`pillars.${weak}`).toLowerCase(), Weak: tc(`pillars.${weak}`) })}</p>
          <div className={styles.checkin}>
            <span>{daysLeft > 0 ? t('score.next', { count: daysLeft }) : t('score.due')}</span>
            <span className={styles.checkinBar} aria-hidden="true">
              <span style={{ width: `${elapsed}%` }} />
            </span>
          </div>
        </div>
      </div>
      <dl className={styles.miniStats}>
        <div>
          <dt>{t('score.bmi')}</dt>
          <dd>{m.bmi ?? '–'}</dd>
        </div>
        <div>
          <dt>{t('score.bp')}</dt>
          <dd>{m.bpCategory ? `${m.systolic}/${m.diastolic}` : t('score.bpNone')}</dd>
        </div>
        <div>
          <dt>{t('score.risk')}</dt>
          <dd>{m.findrisc.applicable ? tc(`categories.findrisc.${m.findrisc.band}`) : t('score.riskNA')}</dd>
        </div>
      </dl>
      <Link to={daysLeft > 0 ? '/health-check/results' : '/health-check'} className={styles.scoreLink}>
        {daysLeft > 0 ? t('score.see') : t('score.retake')}
        <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </section>
  )
}

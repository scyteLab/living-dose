import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, Info } from 'lucide-react'
import Tag from '@/components/ui/Tag'
import { STATUS_TONE } from '@/lib/healthCheck/display'
import styles from './Results.module.css'

/** "You and the guidelines" table, plus the mind and "worth checking" cards. */
export default function Guidance({ results, answers }) {
  const { t } = useTranslation('healthCheck')
  const m = results.measures

  const youText = (row) => {
    const base = `results.rows.${row.id}`
    switch (row.id) {
      case 'minutes':
        return t(`${base}.you`, { count: row.you })
      case 'sleep':
        return t(`${base}.you`, { count: row.you })
      case 'habits': {
        const tob = t('habits.questions.tobacco.options', { returnObjects: true })[answers.habits.tobacco]
        const alc = t('habits.questions.alcohol.options', { returnObjects: true })[answers.habits.alcohol]
        return answers.habits.tobacco === 0 && answers.habits.alcohol === 0 ? t(`${base}.youNone`) : t(`${base}.you`, { tobacco: tob, alcohol: alc })
      }
      default:
        return t(`${base}.you`, { returnObjects: true })[row.you]
    }
  }

  const mindState = answers.mind.skipped ? 'skipped' : m.mindPositive ? 'positive' : 'negative'

  return (
    <section className={styles.guidance} aria-labelledby="guide-title">
      <div className={styles.tableCard}>
        <h2 id="guide-title" className={styles.cardTitle}>
          {t('results.guidelinesTitle')}
        </h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('results.cols.area')}</th>
              <th scope="col">{t('results.cols.you')}</th>
              <th scope="col">{t('results.cols.guideline')}</th>
              <th scope="col">
                <span className="sr-only">{t('results.cols.progress')}</span>
              </th>
              <th scope="col" className={styles.right}>
                {t('results.cols.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {results.guidelines.map((row) => (
              <tr key={row.id}>
                <th scope="row" data-label={t('results.cols.area')}>
                  {t(`results.rows.${row.id}.area`)}
                </th>
                <td data-label={t('results.cols.you')}>{youText(row)}</td>
                <td data-label={t('results.cols.guideline')} className={styles.muted}>
                  {t(`results.rows.${row.id}.target`)}
                </td>
                <td className={styles.progressCell} aria-hidden="true">
                  <span className={styles.progressTrack}>
                    <span style={{ width: `${row.progress ?? 0}%` }} className={styles[`fill_${row.status}`]} />
                  </span>
                </td>
                <td className={styles.right}>
                  <Tag tone={STATUS_TONE[row.status]}>{t(`results.statuses.${row.status}`)}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.sideCards}>
        <div className={styles.mindCard}>
          <p className={styles.sideTitle}>
            <Brain size={22} strokeWidth={1.8} aria-hidden="true" />
            {t('results.mindTitle')}
          </p>
          <p>{t(`results.mind.${mindState}`)}</p>
          {mindState === 'positive' && <p className={styles.strong}>{t('results.mind.crisis')}</p>}
          <Link to="/care">{t('results.mind.cta')}</Link>
        </div>

        {results.checks.length > 0 && (
          <div className={styles.checksCard}>
            <p className={styles.sideTitle}>
              <Info size={22} strokeWidth={1.8} aria-hidden="true" />
              {t('results.checksTitle')}
            </p>
            <ul>
              {results.checks.map((c) => (
                <li key={c}>{t(`results.checks.${c}`)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

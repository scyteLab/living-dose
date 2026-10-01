import { useTranslation } from 'react-i18next'
import { CalendarClock, Check, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import styles from './ConsultationSummary.module.css'

/** The professional's written summary and next steps, shown to the member. */
export default function ConsultationSummary({ summary, professional }) {
  const { t, i18n } = useTranslation('pro')
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(summary.writtenAt))
  return (
    <section className={styles.box} aria-labelledby="summary-h">
      <h2 id="summary-h" className={styles.title}>
        <FileText size={20} strokeWidth={2} aria-hidden="true" />
        {t('summaryMember.title')}
      </h2>
      <p className={styles.from}>{t('summaryMember.from', { name: professional.name, date })}</p>
      <p className={styles.body}>{summary.summary}</p>
      {summary.nextSteps.length > 0 && (
        <>
          <h3 className={styles.sub}>{t('summaryMember.steps')}</h3>
          <ul className={styles.steps}>
            {summary.nextSteps.map((s) => (
              <li key={s}>
                <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </>
      )}
      {summary.followUp && (
        <div className={styles.follow}>
          <p>
            <CalendarClock size={18} strokeWidth={2} aria-hidden="true" />
            {t('summaryMember.followUp', { when: t(`consult.followUpOptions.${summary.followUp}`).toLowerCase() })}
          </p>
          <Button to={`/care/${professional.id}`} variant="care" size="sm">
            {t('summaryMember.book')}
          </Button>
        </div>
      )}
    </section>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Bell, Video } from 'lucide-react'
import styles from './Results.module.css'

export default function NextSteps({ remind, onRemindChange, nextDateText }) {
  const { t } = useTranslation('healthCheck')
  return (
    <section className={styles.block} aria-labelledby="next-title">
      <h2 id="next-title" className={styles.blockTitle}>
        {t('results.nextTitle')}
      </h2>
      <div className={styles.next}>
        <div className={styles.planCard}>
          <p className={styles.planTitle}>{t('results.next.plan.title')}</p>
          <p>{t('results.next.plan.body')}</p>
          <Link to="/plan" className={styles.planButton}>
            {t('results.next.plan.cta')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.nextCard}>
          <span className={`${styles.nextIcon} ${styles.sky}`} aria-hidden="true">
            <Video size={24} strokeWidth={1.8} />
          </span>
          <p className={styles.nextTitle}>{t('results.next.dietitian.title')}</p>
          <p className={styles.muted}>{t('results.next.dietitian.body')}</p>
          <Link to="/care" className={styles.nextLink}>
            {t('results.next.dietitian.cta')}
          </Link>
        </div>
        <div className={styles.nextCard}>
          <span className={`${styles.nextIcon} ${styles.leaf}`} aria-hidden="true">
            <Bell size={24} strokeWidth={1.8} />
          </span>
          <p className={styles.nextTitle}>{t('results.next.remind.title')}</p>
          <p className={styles.muted}>{t('results.next.remind.body')}</p>
          <label className={styles.remind}>
            {t('results.next.remind.label', { date: nextDateText })}
            <input type="checkbox" checked={remind} onChange={(e) => onRemindChange(e.target.checked)} />
          </label>
        </div>
      </div>
    </section>
  )
}

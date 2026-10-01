import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Plus } from 'lucide-react'
import clsx from 'clsx'
import { MINUTES_GOAL, MOODS } from '@/lib/dashboard/habits'
import CardHead from './CardHead'
import WaterTracker from './WaterTracker'
import styles from './Dashboard.module.css'

export default function Habits({ today, setWater, addMinutes, setMood }) {
  const { t } = useTranslation('dashboard')
  const gap = Math.max(0, MINUTES_GOAL - today.minutes)
  const low = today.mood === 'low' || today.mood === 'struggling'

  return (
    <section className={styles.card} aria-labelledby="habits-h">
      <CardHead id="habits-h" title={t('habits.title')} />
      <div className={styles.habitGrid}>
        <div className={styles.waterBox}>
          <WaterTracker value={today.water} onChange={setWater} />
        </div>
        <div className={clsx(styles.habit, styles.minutesBox)}>
          <div className={styles.habitHead}>
            <span className={styles.habitName}>
              <Activity size={18} strokeWidth={2} className={styles.emberIcon} aria-hidden="true" />
              {t('habits.minutes')}
            </span>
            <span className={styles.habitCount} aria-live="polite">
              {t('habits.minutesCount', { count: today.minutes, goal: MINUTES_GOAL })}
            </span>
          </div>
          <span className={styles.bar} aria-hidden="true">
            <span className={styles.barEmber} style={{ width: `${Math.min(100, (today.minutes / MINUTES_GOAL) * 100)}%` }} />
          </span>
          <div className={styles.minutesFoot}>
            <span className={gap ? styles.muted : styles.goalDone}>{gap ? t('habits.minutesGap', { count: gap }) : t('habits.minutesDone')}</span>
            <button type="button" className={styles.addTen} onClick={() => addMinutes(10)} aria-label={t('habits.addTenLabel')}>
              <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
              {t('habits.addTen')}
            </button>
          </div>
        </div>
      </div>

      <fieldset className={styles.mood}>
        <legend className={styles.habitName}>{t('habits.mood')}</legend>
        <div className={styles.moods}>
          {MOODS.map((m) => (
            <button key={m} type="button" aria-pressed={today.mood === m} className={clsx(styles.moodButton, today.mood === m && styles.moodOn)} onClick={() => setMood(m)}>
              {t(`habits.moods.${m}`)}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          {today.mood && !low && <p className={styles.moodNote}>{t('habits.moodThanks')}</p>}
          {low && (
            <p className={styles.moodNote}>
              {t('habits.moodLow')} <Link to="/care?s=psychologist">{t('habits.moodLowCta')}</Link>. {t('habits.moodCrisis')}
            </p>
          )}
        </div>
      </fieldset>
    </section>
  )
}

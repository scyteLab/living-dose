import { useTranslation } from 'react-i18next'
import { Droplet } from 'lucide-react'
import { WATER_GOAL } from '@/lib/dashboard/habits'
import styles from './Dashboard.module.css'

/** Eight glasses to tap. Tapping the last filled glass again takes one off. */
export default function WaterTracker({ value, onChange }) {
  const { t } = useTranslation('dashboard')
  return (
    <div className={styles.habit}>
      <div className={styles.habitHead}>
        <span className={styles.habitName}>
          <Droplet size={18} strokeWidth={2} className={styles.skyIcon} aria-hidden="true" />
          {t('habits.water')}
        </span>
        <span className={styles.habitCount} aria-live="polite">
          {t('habits.waterCount', { count: value, goal: WATER_GOAL })}
        </span>
      </div>
      <div className={styles.glasses} role="group" aria-label={t('habits.waterGroup')}>
        {Array.from({ length: WATER_GOAL }, (_, i) => {
          const on = i < value
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              aria-label={t('habits.glass', { n: i + 1 })}
              className={on ? styles.glassOn : styles.glass}
              onClick={() => onChange(value === i + 1 ? i : i + 1)}
            >
              <Droplet size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

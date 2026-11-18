import { useTranslation } from 'react-i18next'
import { Camera, Droplet } from 'lucide-react'
import Button from '@/components/ui/Button'
import { WATER_GOAL } from '@/lib/dashboard/habits'
import styles from './Dashboard.module.css'

/**
 * Today's glasses of water. The drops only show progress: a glass is added
 * only when a live selfie confirms the member is drinking (see /challenges/water).
 */
export default function WaterTracker({ value }) {
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
      <div className={styles.glasses} role="img" aria-label={t('habits.waterCount', { count: value, goal: WATER_GOAL })}>
        {Array.from({ length: WATER_GOAL }, (_, i) => (
          <span key={i} className={i < value ? styles.glassOn : styles.glass} aria-hidden="true">
            <Droplet size={16} strokeWidth={2} />
          </span>
        ))}
      </div>
      <p className={styles.waterHow}>{t('habits.waterHow')}</p>
      <Button to="/challenges/water" variant="outline" size="sm" className={styles.waterBtn}>
        <Camera size={18} strokeWidth={2} aria-hidden="true" />
        {t('habits.waterSelfie')}
      </Button>
    </div>
  )
}

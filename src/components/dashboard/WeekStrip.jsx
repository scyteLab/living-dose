import { useTranslation } from 'react-i18next'
import { Flame } from 'lucide-react'
import clsx from 'clsx'
import { mealStreak, weekDays, weekWaterAverage } from '@/lib/dashboard/insights'
import styles from './Dashboard.module.css'

export default function WeekStrip({ planStore, habits }) {
  const { t, i18n } = useTranslation('dashboard')
  const streak = mealStreak(planStore)
  const days = weekDays(planStore)
  const water = weekWaterAverage(habits)
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })

  return (
    <section className={styles.week} aria-labelledby="week-h">
      <div className={styles.streak}>
        <span className={styles.streakIcon} aria-hidden="true">
          <Flame size={24} strokeWidth={2} />
        </span>
        <div>
          <h2 id="week-h" className={styles.streakTitle}>
            {streak ? t('week.streak', { count: streak }) : t('week.streakZero')}
          </h2>
          <p className={styles.muted}>{t('week.streakHint')}</p>
        </div>
      </div>
      <ol className={styles.days} aria-label={t('week.days')}>
        {days.map((d) => {
          const [y, m, dd] = d.date.split('-').map(Number)
          return (
            <li key={d.date} className={clsx(d.logged && styles.dayLogged, d.isToday && styles.dayToday, d.isFuture && styles.dayFuture)}>
              <span className={styles.dayBar} />
              {d.isToday ? t('week.today') : weekday.format(new Date(y, m - 1, dd))}
              {d.logged && <span className="sr-only"> ✓</span>}
            </li>
          )
        })}
      </ol>
      <div className={styles.waterAvg}>
        <p className={styles.waterAvgValue}>{water ? t('week.water', { value: water }) : t('week.waterNone')}</p>
        <p className={styles.muted}>{t('week.waterHint')}</p>
      </div>
    </section>
  )
}

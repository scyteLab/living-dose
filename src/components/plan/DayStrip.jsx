import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import styles from './Plan.module.css'

/** Seven day buttons (a tab list). Shows how many meals are marked as eaten. */
export default function DayStrip({ days, selected, onSelect, todayIndex, eatenCount, mealCount, locale }) {
  const { t } = useTranslation('plan')
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })

  const onKeyDown = (e) => {
    const move = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!move) return
    e.preventDefault()
    const next = (selected + move + 7) % 7
    onSelect(next)
    document.getElementById(`day-tab-${next}`)?.focus()
  }

  return (
    <div className={styles.days} role="tablist" aria-label={t('days.label')} onKeyDown={onKeyDown}>
      {days.map((day, i) => {
        const [y, m, d] = day.date.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const done = eatenCount(i)
        const on = i === selected
        return (
          <button
            key={day.date}
            id={`day-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls="day-panel"
            tabIndex={on ? 0 : -1}
            className={clsx(styles.day, on && styles.dayOn, i === todayIndex && styles.dayToday)}
            onClick={() => onSelect(i)}
          >
            <span className={styles.dayName}>{i === todayIndex ? t('days.today') : weekday.format(date)}</span>
            <span className={styles.dayNum}>{d}</span>
            <span className={styles.dayDots} aria-label={t('days.eaten', { done, total: mealCount })}>
              {Array.from({ length: mealCount }, (_, k) => (
                <span key={k} className={clsx(k < done && styles.dotDone)} />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}

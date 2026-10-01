import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { RECIPES_BY_ID } from '@/data/recipes'
import CardHead from './CardHead'
import styles from './Dashboard.module.css'

/** Today's meals from the plan. Ticking here also ticks them on the Plan page. */
export default function TodayMeals({ day, dayIndex, eaten, onToggle, target }) {
  const { t } = useTranslation('dashboard')
  const tp = useTranslation('plan').t
  const slots = Object.keys(day.meals).filter((s) => day.meals[s])
  const kcal = slots.reduce((sum, s) => {
    const m = day.meals[s]
    return eaten[`${dayIndex}.${s}`] ? sum + Math.round(RECIPES_BY_ID[m.recipeId].kcal * m.portion) : sum
  }, 0)
  const done = slots.filter((s) => eaten[`${dayIndex}.${s}`]).length

  return (
    <section className={styles.card} aria-labelledby="meals-h">
      <CardHead id="meals-h" title={t('meals.title')} link={t('meals.open')} to="/plan" />
      <div className={styles.kcal}>
        <p>
          <strong>{kcal.toLocaleString()}</strong> {t('meals.eatenOf', { target: target.toLocaleString() })} · {t('meals.count', { done, total: slots.length })}
        </p>
        <span className={styles.bar} aria-hidden="true">
          <span className={styles.barEmber} style={{ width: `${Math.min(100, (kcal / target) * 100)}%` }} />
        </span>
      </div>
      <ul className={styles.meals}>
        {slots.map((slot) => {
          const m = day.meals[slot]
          const r = RECIPES_BY_ID[m.recipeId]
          const on = Boolean(eaten[`${dayIndex}.${slot}`])
          return (
            <li key={slot} className={clsx(styles.meal, on && styles.mealOn)}>
              <div className={styles.mealText}>
                <span className={styles.mealSlot}>
                  {tp(`slots.${slot}`)} <span>{tp(`slotTimes.${slot}`)}</span>
                </span>
                <span className={styles.mealName}>{r.name}</span>
                <span className={styles.mealKcal}>{Math.round(r.kcal * m.portion)} kcal</span>
              </div>
              <button
                type="button"
                aria-pressed={on}
                aria-label={t('meals.markLabel', { name: r.name })}
                className={clsx(styles.eat, on && styles.eatOn)}
                onClick={() => onToggle(slot)}
              >
                <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                <span className={styles.eatText}>{on ? t('meals.eatenLabel') : t('meals.markEaten')}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

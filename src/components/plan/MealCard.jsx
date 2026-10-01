import { useTranslation } from 'react-i18next'
import { Apple, Check, Clock, Moon, Repeat2, Sun, Sunrise, UtensilsCrossed } from 'lucide-react'
import clsx from 'clsx'
import Tag from '@/components/ui/Tag'
import { RECIPES_BY_ID } from '@/data/recipes'
import styles from './Plan.module.css'

const SLOT_ICON = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple }
const TAG_TONE = { diabetic: 'sky', heart: 'leaf', protein: 'ember', pregnancy: 'plum' }

export default function MealCard({ slot, meal, eaten, onToggleEaten, onSwap, onRecipe }) {
  const { t } = useTranslation('plan')
  const Icon = SLOT_ICON[slot]

  if (!meal) {
    return (
      <article className={clsx(styles.meal, styles.mealEmpty)}>
        <p className={styles.slot}>{t(`slots.${slot}`)}</p>
        <p className={styles.emptyText}>{t('emptySlot')}</p>
      </article>
    )
  }

  const r = RECIPES_BY_ID[meal.recipeId]
  const kcal = Math.round(r.kcal * meal.portion)
  const tags = [...r.tags.filter((x) => x !== 'pregnancy').slice(0, 2), ...(r.cost === 1 ? ['lowCost'] : [])]

  return (
    <article className={clsx(styles.meal, styles[`slot_${slot}`], eaten && styles.mealEaten)} aria-label={`${t(`slots.${slot}`)}: ${r.name}`}>
      <span className={styles.mealIcon} aria-hidden="true">
        {eaten ? <Check size={24} strokeWidth={2.6} /> : <Icon size={24} strokeWidth={1.8} />}
      </span>
      <div className={styles.mealBody}>
        <p className={styles.slot}>
          {t(`slots.${slot}`)} <span>{t(`slotTimes.${slot}`)}</span>
          {meal.swapped && <span className={styles.swappedTag}>{t('actions.swapped')}</span>}
        </p>
        <h3 className={styles.mealName}>{r.name}</h3>
        <p className={styles.mealMeta}>
          <span className={styles.kcal}>{kcal} kcal</span>
          <span>{t(`portion.${meal.portion}`)}</span>
          <span className={styles.metaIcon}>
            <Clock size={14} strokeWidth={2} aria-hidden="true" />
            {r.minutes ? t('minutes', { count: r.minutes }) : t('noCook')}
          </span>
          {r.batch && <span>{t('batch')}</span>}
        </p>
        {tags.length > 0 && (
          <div className={styles.mealTags}>
            {tags.map((tag) => (
              <Tag key={tag} tone={tag === 'lowCost' ? 'neutral' : TAG_TONE[tag]}>
                {t(`tags.${tag}`)}
              </Tag>
            ))}
          </div>
        )}
        <div className={styles.mealActions}>
          <button type="button" aria-pressed={eaten} className={clsx(styles.eatButton, eaten && styles.eatOn)} onClick={onToggleEaten}>
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
            {eaten ? t('actions.eaten') : t('actions.markEaten')}
          </button>
          <button type="button" className={styles.textAction} onClick={onSwap}>
            <Repeat2 size={16} strokeWidth={2} aria-hidden="true" />
            {t('actions.swap')}
          </button>
          <button type="button" className={styles.textAction} onClick={onRecipe}>
            <UtensilsCrossed size={16} strokeWidth={2} aria-hidden="true" />
            {t('actions.recipe')}
          </button>
        </div>
      </div>
    </article>
  )
}

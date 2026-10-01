import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Minus, Plus } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import { RECIPES_BY_ID } from '@/data/recipes'
import { formatQty } from '@/lib/mealPlan/shoppingList'
import styles from './Plan.module.css'

const NUTRIENTS = [
  ['kcal', 'kcal'],
  ['protein', 'g'],
  ['carbs', 'g'],
  ['fat', 'g'],
  ['fibre', 'g'],
  ['salt', 'g'],
]
const TAG_TONE = { diabetic: 'sky', heart: 'leaf', protein: 'ember', pregnancy: 'plum' }

/** Full recipe: nutrition for the planned portion, ingredients scaled to the number of servings, and the method. */
export default function RecipeDialog({ meal, household, onClose }) {
  const { t } = useTranslation('plan')
  const [servings, setServings] = useState(household)
  const r = meal ? RECIPES_BY_ID[meal.recipeId] : null

  return (
    <Dialog open={Boolean(r)} onClose={onClose} title={r?.name ?? ''} size="lg" closeLabel={t('recipe.close')}>
      {r && (
        <div className={styles.recipe}>
          <div className={styles.recipeMeta}>
            <span className={styles.metaIcon}>
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
              {r.minutes ? t('recipe.time', { count: r.minutes }) : t('noCook')}
            </span>
            {r.tags.map((tag) => (
              <Tag key={tag} tone={TAG_TONE[tag]}>
                {t(`tags.${tag}`)}
              </Tag>
            ))}
          </div>

          <section aria-labelledby="per-title">
            <h3 id="per-title" className={styles.recipeHeading}>
              {t('recipe.per')} <span>({t(`portion.${meal.portion}`).toLowerCase()})</span>
            </h3>
            <dl className={styles.nutritionGrid}>
              {NUTRIENTS.map(([k, unit]) => (
                <div key={k}>
                  <dt>{t(`recipe.nutrients.${k}`)}</dt>
                  <dd>
                    {k === 'salt' ? Math.round(r[k] * meal.portion * 10) / 10 : Math.round(r[k] * meal.portion)}
                    <small> {t(`recipe.units.${unit}`)}</small>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.estimates}>{t('recipe.estimates')}</p>
          </section>

          <section aria-labelledby="ing-title" className={styles.recipeSection}>
            <div className={styles.recipeRow}>
              <h3 id="ing-title" className={styles.recipeHeading}>
                {t('recipe.ingredients')} <span>{t('recipe.for', { count: servings })}</span>
              </h3>
              <div className={styles.stepper} role="group" aria-label={t('recipe.servings')}>
                <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label={t('recipe.fewer')} disabled={servings <= 1}>
                  <Minus size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <span aria-live="polite">{servings}</span>
                <button type="button" onClick={() => setServings((s) => Math.min(12, s + 1))} aria-label={t('recipe.more')}>
                  <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </div>
            </div>
            <ul className={styles.ingredients}>
              {r.ingredients.map((ing) => {
                const { qty, unit } = formatQty(ing.qty * meal.portion * servings, ing.unit)
                return (
                  <li key={ing.id}>
                    <span>{ing.name}</span>
                    <span className={styles.itemQty}>{unit ? `${qty} ${unit}` : qty}</span>
                  </li>
                )
              })}
            </ul>
            {r.contains.length > 0 && (
              <p className={styles.contains}>
                {t('recipe.contains', { list: r.contains.map((c) => t(`recipe.containsNames.${c}`)).join(', ') })}
              </p>
            )}
          </section>

          <section aria-labelledby="method-title" className={styles.recipeSection}>
            <h3 id="method-title" className={styles.recipeHeading}>
              {t('recipe.method')}
            </h3>
            <ol className={styles.method}>
              {r.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Dialog>
  )
}

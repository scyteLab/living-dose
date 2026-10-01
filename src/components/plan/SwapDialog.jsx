import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import { RECIPES_BY_ID } from '@/data/recipes'
import { alternatives, portionFor } from '@/lib/mealPlan/generate'
import styles from './Plan.module.css'

const TAG_TONE = { diabetic: 'sky', heart: 'leaf', protein: 'ember', pregnancy: 'plum' }

/** Choose another recipe for one meal. Every option already respects the person's rules. */
export default function SwapDialog({ target, settings, targets, onChoose, onUndo, onClose }) {
  const { t } = useTranslation('plan')
  const open = Boolean(target)
  const current = target ? RECIPES_BY_ID[target.meal.recipeId] : null
  const options = target ? alternatives({ slot: target.slot, currentId: target.meal.recipeId, settings, targets }) : []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={target ? t('swap.title', { meal: t(`slots.${target.slot}`).toLowerCase() }) : ''}
      description={t('swap.intro')}
      closeLabel={t('recipe.close')}
    >
      {open && (
        <div className={styles.swapList}>
          <div className={styles.swapCurrent}>
            <span className={styles.swapLabel}>{t('swap.current')}</span>
            <span className={styles.swapName}>{current.name}</span>
            {target.meal.swapped && (
              <button type="button" className={styles.textAction} onClick={onUndo}>
                <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
                {t('actions.undoSwap')}
              </button>
            )}
          </div>
          {options.length === 0 && <p className={styles.muted}>{t('swap.none')}</p>}
          <ul>
            {options.map((r) => (
              <li key={r.id}>
                <button type="button" className={styles.swapOption} onClick={() => onChoose(r.id)}>
                  <span className={styles.swapName}>{r.name}</span>
                  <span className={styles.swapMeta}>
                    {Math.round(r.kcal * portionFor(r, target.slot, targets.kcal, settings.snacks))} kcal ·{' '}
                    {r.minutes ? t('minutes', { count: r.minutes }) : t('noCook')}
                  </span>
                  <span className={styles.mealTags}>
                    {r.tags
                      .filter((x) => x !== 'pregnancy')
                      .slice(0, 2)
                      .map((tag) => (
                        <Tag key={tag} tone={TAG_TONE[tag]}>
                          {t(`tags.${tag}`)}
                        </Tag>
                      ))}
                  </span>
                  <span className={styles.swapChoose}>{t('swap.choose')}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  )
}

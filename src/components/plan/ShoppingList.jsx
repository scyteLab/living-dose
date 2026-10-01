import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardCopy, RotateCcw, ShoppingBag } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import { buildShoppingList } from '@/lib/mealPlan/shoppingList'
import styles from './Plan.module.css'

const qtyText = (qty, unit) => (unit ? `${qty.toLocaleString()} ${unit}` : `${qty}`)

/** The week's ingredients by aisle, scaled to the household, with ticks that persist. */
export default function ShoppingList({ days, household, checked, onToggle, onReset, weekText }) {
  const { t } = useTranslation('plan')
  const groups = useMemo(() => buildShoppingList(days, household), [days, household])
  const all = groups.flatMap((g) => g.items)
  const done = all.filter((it) => checked[it.key]).length
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const lines = [t('shopping.copyTitle', { date: weekText }), '']
    for (const g of groups) {
      lines.push(t(`shopping.aisles.${g.aisle}`).toUpperCase())
      g.items.forEach((it) => lines.push(`${checked[it.key] ? '✓' : '•'} ${it.name}: ${qtyText(it.qty, it.unit)}`))
      lines.push('')
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <section className={styles.shopping} aria-labelledby="shopping-title">
      <div className={styles.shoppingHead}>
        <div>
          <h2 id="shopping-title" className={styles.sectionTitle}>
            {t('shopping.title')}
          </h2>
          <p className={styles.muted}>{t('shopping.intro', { count: household })}</p>
        </div>
        <div className={styles.shoppingActions}>
          <span className={styles.progressPill} aria-live="polite">
            {t('shopping.progress', { done, total: all.length })}
          </span>
          <button type="button" className={styles.textAction} onClick={copy}>
            <ClipboardCopy size={16} strokeWidth={2} aria-hidden="true" />
            {copied ? t('shopping.copied') : t('shopping.copy')}
          </button>
          <button type="button" className={styles.textAction} onClick={onReset} disabled={done === 0}>
            <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
            {t('shopping.reset')}
          </button>
        </div>
      </div>

      <div className={styles.aisles}>
        {groups.map((g) => (
          <fieldset key={g.aisle} className={styles.aisle}>
            <legend className={styles.aisleTitle}>{t(`shopping.aisles.${g.aisle}`)}</legend>
            <ul>
              {g.items.map((it) => (
                <li key={it.key}>
                  <label className={clsx(styles.item, checked[it.key] && styles.itemDone)}>
                    <input type="checkbox" checked={Boolean(checked[it.key])} onChange={() => onToggle(it.key)} />
                    <span className={styles.itemName}>{it.name}</span>
                    <span className={styles.itemQty}>{qtyText(it.qty, it.unit)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>

      <div className={styles.shopCta}>
        <Button to="/shop" variant="primary">
          <ShoppingBag size={18} strokeWidth={2} aria-hidden="true" />
          {t('shopping.shop')}
        </Button>
      </div>
    </section>
  )
}

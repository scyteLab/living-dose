import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock, Minus, Plus, ShoppingBasket } from 'lucide-react'
import { Helpful, SaveButton, ShareButton } from '@/components/learn/Actions'
import Cover from '@/components/learn/Cover'
import ItemCard from '@/components/learn/ItemCard'
import styles from '@/components/learn/Learn.module.css'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { PRODUCTS } from '@/data/products'
import { RECIPES_BY_ID } from '@/data/recipes'
import useCart from '@/hooks/useCart'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { LIBRARY } from '@/lib/learn/content'
import { formatQty } from '@/lib/mealPlan/shoppingList'

const NUTRIENTS = [
  ['kcal', 'kcal'],
  ['protein', 'g'],
  ['carbs', 'g'],
  ['fat', 'g'],
  ['fibre', 'g'],
  ['salt', 'g'],
]
const TAG_TONE = { diabetic: 'sky', heart: 'leaf', protein: 'ember', pregnancy: 'plum' }

export default function RecipePage() {
  const { recipeId } = useParams()
  const { t } = useTranslation('learn')
  const tp = useTranslation('plan').t
  const r = RECIPES_BY_ID[recipeId]
  useDocumentTitle(r?.name ?? t('docTitle'))
  const { addMany } = useCart()
  const [servings, setServings] = useState(2)
  const [added, setAdded] = useState(null)

  if (!r) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('recipe.notFound')}>
          <Link to="/learn?kind=recipe">{t('recipe.back')}</Link>
        </PageIntro>
      </div>
    )
  }

  const item = LIBRARY.find((i) => i.kind === 'recipe' && i.id === r.id)
  const products = [...new Set(r.ingredients.map((ing) => PRODUCTS.find((p) => p.ingredientIds.includes(ing.id))?.id).filter(Boolean))]
  const more = LIBRARY.filter((i) => i.kind === 'recipe' && i.id !== r.id && i.meal === r.meal).slice(0, 3)

  return (
    <div className={styles.page}>
      <Link to="/learn?kind=recipe" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('recipe.back')}
      </Link>

      <div className={styles.recipeLayout}>
        <div className={styles.recipeMain}>
          <header className={styles.articleHead}>
            <span className={styles.kind}>{t(`meals.${r.meal}`)}</span>
            <h1 className={styles.articleTitle}>{r.name}</h1>
            <div className={styles.articleMeta}>
              <span className={styles.metaIcon}>
                <Clock size={16} strokeWidth={2} aria-hidden="true" />
                {r.minutes ? t('minutesCook', { count: r.minutes }) : t('noCook')}
              </span>
              {r.batch && <span>{tp('batch')}</span>}
            </div>
            <div className={styles.tags}>
              {r.tags.map((tag) => (
                <Tag key={tag} tone={TAG_TONE[tag]}>
                  {t(`tags.${tag}`)}
                </Tag>
              ))}
            </div>
            <div className={styles.actions}>
              <SaveButton itemKey={`recipe:${r.id}`} title={r.name} />
              <ShareButton title={r.name} text={r.steps[0]} />
            </div>
          </header>

          <Cover item={item} size="wide" />

          <section className={styles.bodySection} aria-labelledby="method-h">
            <h2 id="method-h" className={styles.sectionTitle}>
              {t('recipe.method')}
            </h2>
            <ol className={styles.method}>
              {r.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          <Helpful itemKey={`recipe:${r.id}`} />
        </div>

        <aside className={styles.recipeSide}>
          <section className={styles.panel} aria-labelledby="ing-h">
            <div className={styles.panelHead}>
              <h2 id="ing-h" className={styles.panelTitle}>
                {t('recipe.ingredients')}
              </h2>
              <div className={styles.stepper} role="group" aria-label={t('recipe.servings')}>
                <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label={t('recipe.fewerServings')} disabled={servings <= 1}>
                  <Minus size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <span aria-live="polite">{servings}</span>
                <button type="button" onClick={() => setServings((s) => Math.min(12, s + 1))} aria-label={t('recipe.moreServings')}>
                  <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className={styles.muted}>{t('recipe.for', { count: servings })}</p>
            <ul className={styles.ingredients}>
              {r.ingredients.map((ing) => {
                const { qty, unit } = formatQty(ing.qty * servings, ing.unit)
                return (
                  <li key={ing.id}>
                    <span>{ing.name}</span>
                    <span className={styles.qty}>{unit ? `${qty} ${unit}` : qty}</span>
                  </li>
                )
              })}
            </ul>
            {r.contains.length > 0 && (
              <p className={styles.small}>{t('recipe.contains', { list: r.contains.map((c) => tp(`recipe.containsNames.${c}`)).join(', ') })}</p>
            )}
            <Button
              variant="action"
              className={styles.full}
              onClick={() => {
                addMany(products.map((productId) => ({ productId, qty: 1 })))
                setAdded(products.length)
              }}
            >
              <ShoppingBasket size={18} strokeWidth={2} aria-hidden="true" />
              {t('recipe.shop')}
            </Button>
            {added && (
              <p className={styles.added} role="status">
                {t('recipe.added', { count: added })} <Link to="/basket">{t('recipe.viewBasket')}</Link>
              </p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="nut-h">
            <h2 id="nut-h" className={styles.panelTitle}>
              {t('recipe.serves')}
            </h2>
            <dl className={styles.nutrition}>
              {NUTRIENTS.map(([k, unit]) => (
                <div key={k}>
                  <dt>{t(`recipe.nutrients.${k}`)}</dt>
                  <dd>
                    {r[k]}
                    <small> {unit}</small>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.small}>{t('recipe.estimates')}</p>
          </section>
        </aside>
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more-h" className={styles.allSection}>
          <h2 id="more-h" className={styles.sectionTitle}>
            {t('recipe.moreRecipes')}
          </h2>
          <ul className={styles.grid}>
            {more.map((m) => (
              <li key={m.id}>
                <ItemCard item={m} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

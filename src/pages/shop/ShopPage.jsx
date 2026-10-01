import { useDeferredValue, useId } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import PlanToBasket from '@/components/shop/PlanToBasket'
import ProductCard from '@/components/shop/ProductCard'
import styles from '@/components/shop/Shop.module.css'
import { shop } from '@/config/shop'
import { CATEGORIES, PRODUCTS } from '@/data/products'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/shop/money'

const DIETS = ['diabetic', 'heart', 'pregnancy', 'protein', 'lowCost']
const SORTS = ['recommended', 'priceLow', 'priceHigh', 'name']

/** Search, category and filters live in the address, so a filtered view can be shared or bookmarked. */
export default function ShopPage() {
  const { t } = useTranslation('shop')
  useDocumentTitle(t('docTitle'))
  const { user } = useAuth()
  const searchId = useId()
  const sortId = useId()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') ?? ''
  const category = CATEGORIES.includes(params.get('c')) ? params.get('c') : 'all'
  const diets = (params.get('diet') ?? '').split(',').filter((d) => DIETS.includes(d))
  const sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'recommended'
  const query = useDeferredValue(q)

  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'all' || v === 'recommended') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const toggleDiet = (d) => update({ diet: (diets.includes(d) ? diets.filter((x) => x !== d) : [...diets, d]).join(',') })

  // The catalogue is small, so filtering on every render is instant
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = PRODUCTS.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      diets.every((d) => p.tags.includes(d)) &&
      words.every((w) => `${p.name} ${p.description} ${p.unit}`.toLowerCase().includes(w)),
  )
  const results =
    sort === 'priceLow'
      ? [...matches].sort((a, b) => a.price - b.price)
      : sort === 'priceHigh'
        ? [...matches].sort((a, b) => b.price - a.price)
        : sort === 'name'
          ? [...matches].sort((a, b) => a.name.localeCompare(b.name))
          : matches

  const filtered = q || category !== 'all' || diets.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.shopHead}>
        <div className={styles.shopTitleBlock}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.intro}>{t('intro')}</p>
        </div>
        <div className={styles.search}>
          <label htmlFor={searchId} className="sr-only">
            {t('searchLabel')}
          </label>
          <Search className={styles.searchIcon} size={20} strokeWidth={2} aria-hidden="true" />
          <input id={searchId} type="search" placeholder={t('searchPlaceholder')} value={q} onChange={(e) => update({ q: e.target.value })} autoComplete="off" />
          {q && (
            <button type="button" className={styles.searchClear} onClick={() => update({ q: '' })} aria-label={t('clear')}>
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <PlanToBasket user={user} />

      <nav className={styles.categories} aria-label={t('categories.all')}>
        {['all', ...CATEGORIES].map((c) => (
          <button key={c} type="button" aria-pressed={category === c} className={clsx(styles.categoryChip, category === c && styles.categoryOn)} onClick={() => update({ c })}>
            {t(`categories.${c}`)}
          </button>
        ))}
      </nav>

      <div className={styles.toolbar}>
        <div className={styles.diets} role="group" aria-label={t('filters.label')}>
          {DIETS.map((d) => (
            <button key={d} type="button" aria-pressed={diets.includes(d)} className={clsx(styles.dietChip, diets.includes(d) && styles.dietOn)} onClick={() => toggleDiet(d)}>
              {t(`filters.${d}`)}
            </button>
          ))}
        </div>
        <div className={styles.sort}>
          <label htmlFor={sortId}>{t('sort.label')}</label>
          <select id={sortId} value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className={styles.count} aria-live="polite">
        {t('count', { count: results.length })}
        {filtered && (
          <button type="button" className={styles.linkButton} onClick={() => setParams({}, { replace: true })}>
            {t('clear')}
          </button>
        )}
      </p>

      {results.length === 0 ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : (
        <ul className={styles.grid}>
          {results.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      <p className={styles.pricesNote}>{t('prices', { amount: formatPrice(shop.freeDeliveryFrom) })}</p>
    </div>
  )
}

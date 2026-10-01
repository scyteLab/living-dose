import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarCheck2, ShoppingBasket } from 'lucide-react'
import Button from '@/components/ui/Button'
import useCart from '@/hooks/useCart'
import useMealPlan from '@/hooks/useMealPlan'
import { productsForPlan } from '@/lib/shop/planToBasket'
import styles from './Shop.module.css'

/** Banner that adds this week's meal-plan shopping list to the basket. */
export default function PlanToBasket({ user }) {
  const { t } = useTranslation('shop')
  if (!user) {
    return (
      <div className={styles.planBanner}>
        <span className={styles.planIcon} aria-hidden="true">
          <CalendarCheck2 size={24} strokeWidth={1.8} />
        </span>
        <div className={styles.planText}>
          <p className={styles.planTitle}>{t('plan.title')}</p>
          <p>{t('plan.signedOut')}</p>
        </div>
        <Button to="/sign-in" state={{ from: '/shop' }} variant="outline" size="sm">
          {t('plan.signIn')}
        </Button>
      </div>
    )
  }
  return <PlanToBasketForUser user={user} />
}

function PlanToBasketForUser({ user }) {
  const { t } = useTranslation('shop')
  const mp = useMealPlan(user)
  const { addMany } = useCart()
  const [added, setAdded] = useState(null)
  const household = mp.settings.household
  const items = useMemo(() => (mp.plan ? productsForPlan(mp.plan.days, household).products : []), [mp.plan, household])
  const count = items.reduce((n, i) => n + i.qty, 0)

  if (!mp.plan) return null

  return (
    <div className={styles.planBanner}>
      <span className={styles.planIcon} aria-hidden="true">
        <CalendarCheck2 size={24} strokeWidth={1.8} />
      </span>
      <div className={styles.planText}>
        <p className={styles.planTitle}>{t('plan.title')}</p>
        <p>{household > 1 ? t('plan.body_household', { count: household }) : t('plan.body')}</p>
        {added && (
          <p className={styles.planAdded} role="status">
            {t('plan.added', { count: added })} <Link to="/basket">{t('plan.view')}</Link>
          </p>
        )}
      </div>
      <Button
        variant="action"
        size="sm"
        onClick={() => {
          addMany(items)
          setAdded(count)
        }}
        disabled={count === 0}
      >
        <ShoppingBasket size={17} strokeWidth={2} aria-hidden="true" />
        {t('plan.cta', { count })}
      </Button>
    </div>
  )
}

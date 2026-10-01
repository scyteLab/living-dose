import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingBasket } from 'lucide-react'
import useCart from '@/hooks/useCart'
import styles from './Shop.module.css'

/** Basket icon with the number of items, for the navigation bar. */
export default function BasketButton() {
  const { t } = useTranslation('shop')
  const { totals } = useCart()
  const count = totals.itemCount
  return (
    <Link to="/basket" className={styles.basketButton} aria-label={count ? t('basket.openCount', { count }) : t('basket.open')}>
      <ShoppingBasket size={20} strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.basketCount} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

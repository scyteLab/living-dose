import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import clsx from 'clsx'
import useCart from '@/hooks/useCart'
import QuantityStepper from './QuantityStepper'
import styles from './Shop.module.css'

/** "Add" becomes a − 1 + stepper once the product is in the basket. */
export default function AddToBasket({ product, size = 'md', full = false }) {
  const { t } = useTranslation('shop')
  const { quantityOf, add, setQty } = useCart()
  const qty = quantityOf(product.id)

  if (qty > 0) return <QuantityStepper name={product.name} qty={qty} onChange={(q) => setQty(product.id, q)} size={size} />

  return (
    <button type="button" className={clsx(styles.addButton, styles[`add_${size}`], full && styles.full)} onClick={() => add(product.id)}>
      <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
      {size === 'lg' ? t('addToBasket') : t('add')}
      {size !== 'lg' && <span className="sr-only"> {product.name}</span>}
    </button>
  )
}

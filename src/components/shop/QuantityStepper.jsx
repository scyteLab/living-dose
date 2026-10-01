import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import clsx from 'clsx'
import { shop } from '@/config/shop'
import styles from './Shop.module.css'

export default function QuantityStepper({ name, qty, onChange, size = 'md' }) {
  const { t } = useTranslation('shop')
  return (
    <div className={clsx(styles.stepper, styles[`stepper_${size}`])} role="group" aria-label={t('qtyLabel', { name })}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={t('decrease', { name })}>
        <Minus size={16} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label={t('increase', { name })} disabled={qty >= shop.maxQuantity}>
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  )
}

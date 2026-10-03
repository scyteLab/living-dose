import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/shop/money'
import styles from './PaymentStatus.module.css'

/** Where an online payment stands, with a way to pay (again) when needed. */
export default function PaymentStatus({ order, confirming, paying, onPay, demoPaid }) {
  const { t } = useTranslation('shop')
  const status = confirming ? 'confirming' : order.paymentStatus

  if (status === 'paid') {
    return (
      <p className={clsx(styles.box, styles.paid)} role="status">
        <CheckCircle2 size={20} strokeWidth={2.2} aria-hidden="true" />
        {demoPaid ? t('payment.demoPaid') : t('payment.paid')}
      </p>
    )
  }
  if (status === 'confirming') {
    return (
      <div className={clsx(styles.box, styles.waiting)} role="status" aria-live="polite">
        <Clock size={20} strokeWidth={2.2} aria-hidden="true" />
        <span>
          <strong>{t('payment.confirming')}</strong>
          {t('payment.confirmingBody')}
        </span>
      </div>
    )
  }
  const failed = status === 'failed'
  return (
    <div className={clsx(styles.box, failed ? styles.failed : styles.waiting)} role={failed ? 'alert' : 'status'}>
      {failed ? <XCircle size={20} strokeWidth={2.2} aria-hidden="true" /> : <CreditCard size={20} strokeWidth={2.2} aria-hidden="true" />}
      <span>
        <strong>{failed ? t('payment.failed') : t('payment.pending')}</strong>
        {failed ? t('payment.failedBody') : t('payment.pendingBody')}
      </span>
      <Button variant="action" size="sm" onClick={onPay} disabled={paying} className={styles.button}>
        {paying ? t('payment.opening') : failed ? t('payment.tryAgain') : t('payment.payNow', { amount: formatPrice(order.total) })}
      </Button>
    </div>
  )
}

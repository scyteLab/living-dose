import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleCheck } from 'lucide-react'
import OrderTimeline from '@/components/shop/OrderTimeline'
import styles from '@/components/shop/Shop.module.css'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/shop/money'
import { getOrder } from '@/lib/shop/orders'

export default function OrderPage() {
  const { orderId } = useParams()
  const { t, i18n } = useTranslation('shop')
  useDocumentTitle(t('order.docTitle', { id: orderId }))
  const { user, firstName } = useAuth()
  const location = useLocation()
  const [order, setOrder] = useState(undefined)

  useEffect(() => {
    let alive = true
    getOrder(user.id, orderId).then((o) => alive && setOrder(o))
    return () => {
      alive = false
    }
  }, [user.id, orderId])

  if (order === undefined) return <div className={styles.loading} role="status" />
  if (!order) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('order.notFound')}>
          <Link to="/orders">{t('order.all')}</Link>
        </PageIntro>
      </div>
    )
  }

  const justPlaced = location.state?.justPlaced
  const [date, slotWindow] = order.slot.split('|')
  const [y, m, d] = date.split('-').map(Number)
  const slotDate = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
  const placed = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(order.createdAt))
  const a = order.address

  return (
    <div className={styles.page}>
      {justPlaced && (
        <div className={styles.placed} role="status">
          <CircleCheck size={28} strokeWidth={2} aria-hidden="true" />
          <p>{firstName ? t('order.thanksNamed', { name: firstName }) : t('order.thanks')}</p>
        </div>
      )}

      <header className={styles.orderHead}>
        <div>
          <p className={styles.muted}>{t('order.number')}</p>
          <h1 className={styles.orderNumber}>{order.id}</h1>
          <p className={styles.muted}>{t('order.placedOn', { date: placed })}</p>
        </div>
        <p className={styles.deliveryPill}>{t('order.deliveryOn', { date: slotDate, window: t(`checkout.windows.${slotWindow}`) })}</p>
      </header>

      <div className={styles.checkoutLayout}>
        <div className={styles.checkoutMain}>
          <section className={styles.panel}>
            {order.status === 'cancelled' ? <p className={styles.errorText}>{t('order.cancelledNotice')}</p> : <OrderTimeline status={order.status} />}
          </section>

          <section className={styles.panel} aria-labelledby="items-title">
            <h2 id="items-title" className={styles.panelTitle}>
              {t('order.items')}
            </h2>
            <ul className={styles.orderItems}>
              {order.items.map((it) => (
                <li key={it.productId}>
                  <span>
                    <strong>{it.qty} ×</strong> {it.name} <small>({it.unit})</small>
                  </span>
                  <span>{formatPrice(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.summary}>
          <dl className={styles.sums}>
            <div>
              <dt>{t('basket.subtotal')}</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt>{t('basket.delivery')}</dt>
              <dd>{order.delivery === 0 ? t('basket.free') : formatPrice(order.delivery)}</dd>
            </div>
            <div className={styles.sumTotal}>
              <dt>{t('basket.total')}</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <div className={styles.orderDetail}>
            <p className={styles.subTitle}>{t('order.deliverTo')}</p>
            <p>
              {a.name}
              <br />
              {a.street}, {a.area}
              <br />
              {a.city}, {a.state}
              {a.landmark && (
                <>
                  <br />
                  {a.landmark}
                </>
              )}
              <br />
              {a.phone}
            </p>
          </div>
          <div className={styles.orderDetail}>
            <p className={styles.subTitle}>{t('order.payment')}</p>
            <p>{t('order.payOnDelivery', { amount: formatPrice(order.total) })}</p>
          </div>
          <p className={styles.muted}>
            {t('order.help')} <Link to="/contact?topic=order">{t('order.contact')}</Link>
          </p>
          <Button to="/shop" variant="outline" className={styles.full}>
            {t('order.continue')}
          </Button>
          <Link to="/orders" className={styles.keepShopping}>
            {t('order.all')}
          </Link>
        </aside>
      </div>
    </div>
  )
}

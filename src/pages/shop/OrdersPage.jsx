import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Package } from 'lucide-react'
import styles from '@/components/shop/Shop.module.css'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/shop/money'
import { listOrders } from '@/lib/shop/orders'

export default function OrdersPage() {
  const { t, i18n } = useTranslation('shop')
  useDocumentTitle(t('orders.docTitle'))
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    let alive = true
    listOrders(user.id).then((o) => alive && setOrders(o))
    return () => {
      alive = false
    }
  }, [user.id])

  if (!orders) return <div className={styles.loading} role="status" />
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('orders.title')}</h1>
      {orders.length === 0 ? (
        <div className={styles.emptyBasket}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Package size={34} strokeWidth={1.6} />
          </span>
          <p className={styles.intro}>{t('orders.empty')}</p>
          <Button to="/shop">{t('basket.browse')}</Button>
        </div>
      ) : (
        <ul className={styles.orderList}>
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className={styles.orderRow} aria-label={`${t('orders.view')} ${o.id}`}>
                <span className={styles.orderRowMain}>
                  <strong>{o.id}</strong>
                  <span>
                    {fmt.format(new Date(o.createdAt))} · {t('orders.itemsCount', { count: o.items.reduce((n, i) => n + i.qty, 0) })}
                  </span>
                </span>
                <Tag tone="sky">{t(`order.status.${o.status}`)}</Tag>
                <span className={styles.orderRowTotal}>{formatPrice(o.total)}</span>
                <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

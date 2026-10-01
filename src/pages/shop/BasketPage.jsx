import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShoppingBasket, Trash2, Truck } from 'lucide-react'
import ProductTile from '@/components/shop/ProductTile'
import QuantityStepper from '@/components/shop/QuantityStepper'
import styles from '@/components/shop/Shop.module.css'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useCart from '@/hooks/useCart'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/shop/money'

export function OrderSummary({ totals, children }) {
  const { t } = useTranslation('shop')
  return (
    <aside className={styles.summary} aria-labelledby="summary-title">
      <h2 id="summary-title" className={styles.subTitle}>
        {t('basket.summary')}
      </h2>
      <dl className={styles.sums}>
        <div>
          <dt>
            {t('basket.subtotal')} <small>({t('basket.items', { count: totals.itemCount })})</small>
          </dt>
          <dd>{formatPrice(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>{t('basket.delivery')}</dt>
          <dd>{totals.delivery === 0 ? t('basket.free') : formatPrice(totals.delivery)}</dd>
        </div>
        <div className={styles.sumTotal}>
          <dt>{t('basket.total')}</dt>
          <dd>{formatPrice(totals.total)}</dd>
        </div>
      </dl>
      <p className={styles.freeNote}>
        <Truck size={17} strokeWidth={2} aria-hidden="true" />
        {totals.freeDelivery ? t('basket.freeReached') : t('basket.freeFrom', { amount: formatPrice(totals.toFreeDelivery) })}
      </p>
      {children}
    </aside>
  )
}

export default function BasketPage() {
  const { t } = useTranslation('shop')
  useDocumentTitle(t('basket.docTitle'))
  const { user } = useAuth()
  const { totals, setQty, remove, clear } = useCart()

  if (totals.itemCount === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyBasket}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <ShoppingBasket size={34} strokeWidth={1.6} />
          </span>
          <h1 className={styles.title}>{t('basket.empty')}</h1>
          <p className={styles.intro}>{t('basket.emptyBody')}</p>
          <Button to="/shop">{t('basket.browse')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.basketHead}>
        <h1 className={styles.title}>{t('basket.title')}</h1>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            if (window.confirm(t('basket.clearConfirm'))) clear()
          }}
        >
          {t('basket.clear')}
        </button>
      </div>

      <div className={styles.checkoutLayout}>
        <ul className={styles.lines}>
          {totals.lines.map(({ product, qty, total }) => (
            <li key={product.id} className={styles.line}>
              <ProductTile product={product} size="sm" />
              <div className={styles.lineInfo}>
                <Link to={`/shop/${product.id}`} className={styles.lineName}>
                  {product.name}
                </Link>
                <span className={styles.lineUnit}>
                  {product.unit} · {formatPrice(product.price)}
                </span>
              </div>
              <QuantityStepper name={product.name} qty={qty} onChange={(q) => setQty(product.id, q)} size="sm" />
              <span className={styles.lineTotal}>{formatPrice(total)}</span>
              <button type="button" className={styles.iconButton} onClick={() => remove(product.id)} aria-label={t('basket.remove', { name: product.name })}>
                <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <OrderSummary totals={totals}>
          {user ? (
            <Button to="/checkout" variant="action" className={styles.full}>
              {t('basket.checkout')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Button>
          ) : (
            <Button to="/sign-in" state={{ from: '/checkout' }} variant="action" className={styles.full}>
              {t('basket.signInToCheckout')}
            </Button>
          )}
          <Link to="/shop" className={styles.keepShopping}>
            {t('basket.keepShopping')}
          </Link>
        </OrderSummary>
      </div>
    </div>
  )
}

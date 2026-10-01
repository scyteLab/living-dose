import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import Tag from '@/components/ui/Tag'
import { formatPrice } from '@/lib/shop/money'
import AddToBasket from './AddToBasket'
import ProductTile from './ProductTile'
import styles from './Shop.module.css'

const TAG_TONE = { diabetic: 'sky', heart: 'leaf', pregnancy: 'plum', protein: 'ember', lowCost: 'neutral' }

export default function ProductCard({ product }) {
  const { t } = useTranslation('shop')
  return (
    <article className={styles.card}>
      <div className={styles.cardTileWrap}>
        <ProductTile product={product} />
        {product.trace && (
          <span className={styles.traceBadge}>
            <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" />
            {t('traceable')}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>
          {/* The link covers the whole card; the basket button sits above it */}
          <Link to={`/shop/${product.id}`} className={styles.cardLink}>
            {product.name}
          </Link>
        </h3>
        <p className={styles.cardUnit}>{product.unit}</p>
        {product.tags.length > 0 && (
          <div className={styles.cardTags}>
            {product.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} tone={TAG_TONE[tag]}>
                {t(`tags.${tag}`)}
              </Tag>
            ))}
          </div>
        )}
        <div className={styles.cardFoot}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          <div className={styles.cardAction}>
            <AddToBasket product={product} size="sm" />
          </div>
        </div>
      </div>
    </article>
  )
}

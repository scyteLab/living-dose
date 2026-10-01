import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Banknote, House, ShieldCheck, Sprout, Truck, Warehouse } from 'lucide-react'
import AddToBasket from '@/components/shop/AddToBasket'
import ProductCard from '@/components/shop/ProductCard'
import ProductTile from '@/components/shop/ProductTile'
import styles from '@/components/shop/Shop.module.css'
import PageIntro from '@/components/page/PageIntro'
import Tag from '@/components/ui/Tag'
import { PRODUCTS, PRODUCTS_BY_ID } from '@/data/products'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/shop/money'

const TAG_TONE = { diabetic: 'sky', heart: 'leaf', pregnancy: 'plum', protein: 'ember', lowCost: 'neutral' }

export default function ProductPage() {
  const { productId } = useParams()
  const { t } = useTranslation('shop')
  const product = PRODUCTS_BY_ID[productId]
  useDocumentTitle(product?.name ?? t('docTitle'))

  if (!product) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('product.notFound')}>
          <Link to="/shop">{t('product.back')}</Link>
        </PageIntro>
      </div>
    )
  }

  // Related: same category first, sharing a diet tag if possible
  const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => b.tags.filter((x) => product.tags.includes(x)).length - a.tags.filter((x) => product.tags.includes(x)).length)
    .slice(0, 4)

  return (
    <div className={styles.page}>
      <Link to="/shop" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('product.back')}
      </Link>

      <div className={styles.productLayout}>
        <ProductTile product={product} size="lg" />
        <div className={styles.productInfo}>
          <p className={styles.productCategory}>{t(`categories.${product.category}`)}</p>
          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.productUnit}>{product.unit}</p>
          <p className={styles.productPrice}>{formatPrice(product.price)}</p>
          <div className={styles.productBuy}>
            <AddToBasket product={product} size="lg" />
          </div>
          <p className={styles.productPerks}>
            <span>
              <Truck size={17} strokeWidth={2} aria-hidden="true" />
              {t('product.delivery')}
            </span>
          </p>

          <section className={styles.productSection} aria-labelledby="about-title">
            <h2 id="about-title" className={styles.subTitle}>
              {t('product.about')}
            </h2>
            <p>{product.description}</p>
          </section>

          {product.tags.length > 0 && (
            <section className={styles.productSection} aria-labelledby="diet-title">
              <h2 id="diet-title" className={styles.subTitle}>
                {t('product.diet')}
              </h2>
              <div className={styles.cardTags}>
                {product.tags.map((tag) => (
                  <Tag key={tag} tone={TAG_TONE[tag]}>
                    {t(`tags.${tag}`)}
                  </Tag>
                ))}
              </div>
            </section>
          )}

          {product.trace && (
            <section className={styles.traceCard} aria-labelledby="trace-title">
              <h2 id="trace-title" className={styles.subTitle}>
                <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />
                {t('product.trace')}
              </h2>
              <ol className={styles.traceSteps}>
                <li>
                  <Sprout size={18} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <strong>{t('product.traceSteps.farm')}</strong>
                    {product.trace.place} · {t('harvested', { count: product.trace.days })}
                  </span>
                </li>
                <li>
                  <Warehouse size={18} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <strong>{t('product.traceSteps.hub')}</strong>
                    {t('product.hub')}
                  </span>
                </li>
                <li>
                  <House size={18} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <strong>{t('product.traceSteps.door')}</strong>
                    {t('product.you')}
                  </span>
                </li>
              </ol>
            </section>
          )}

          <p className={styles.productPay}>
            <Banknote size={17} strokeWidth={2} aria-hidden="true" />
            {t('product.payOnDelivery')}
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title" className={styles.sectionTitle}>
            {t('product.related')}
          </h2>
          <ul className={styles.grid}>
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

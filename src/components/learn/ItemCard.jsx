import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Flame } from 'lucide-react'
import { itemHref } from '@/lib/learn/content'
import Cover from './Cover'
import styles from './Learn.module.css'

export default function ItemCard({ item, featured = false }) {
  const { t } = useTranslation('learn')
  return (
    <article className={featured ? styles.featuredCard : styles.card}>
      <Cover item={item} size={featured ? 'lg' : 'md'} />
      <div className={styles.cardBody}>
        <p className={styles.cardMeta}>
          <span className={styles.kind}>{item.kind === 'recipe' ? t(`meals.${item.meal}`) : t(`topics.${item.topic}`)}</span>
          <span className={styles.metaIcon}>
            <Clock size={14} strokeWidth={2} aria-hidden="true" />
            {item.kind === 'recipe' ? (item.minutes ? t('minutesCook', { count: item.minutes }) : t('noCook')) : t('minutesRead', { count: item.minutes })}
          </span>
          {item.kind === 'recipe' && (
            <span className={styles.metaIcon}>
              <Flame size={14} strokeWidth={2} aria-hidden="true" />
              {t('kcal', { count: item.kcal })}
            </span>
          )}
        </p>
        <h3 className={featured ? styles.featuredTitle : styles.cardTitle}>
          <Link to={itemHref(item)} className={styles.cardLink}>
            {item.title}
          </Link>
        </h3>
        {(featured || item.kind === 'article') && <p className={styles.cardSummary}>{item.summary}</p>}
      </div>
    </article>
  )
}

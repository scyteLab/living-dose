import { useTranslation } from 'react-i18next'
import { FileWarning } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import Tag from '@/components/ui/Tag'
import { ARTICLES } from '@/data/articles'
import { SEED_POSTS } from '@/data/community'
import { FOODS } from '@/data/foods'
import { PRODUCTS } from '@/data/products'
import { PROFESSIONALS } from '@/data/professionals'
import { RECIPES } from '@/data/recipes'
import useDocumentTitle from '@/hooks/useDocumentTitle'

const OTHER = [
  ['recipes', RECIPES.length],
  ['foods', FOODS.length],
  ['scoring', null],
  ['professionals', PROFESSIONALS.length],
  ['community', SEED_POSTS.length],
  ['products', PRODUCTS.length],
]

export default function StaffContent() {
  const { t } = useTranslation('staff')
  const tl = useTranslation('learn').t
  useDocumentTitle(t('content.title'))

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('content.title')}</h1>
      <p className={styles.muted}>{t('content.intro')}</p>
      <section aria-labelledby="articles-h">
        <h2 id="articles-h" className={styles.dayTitle}>
          {t('content.articles')}
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {ARTICLES.map((a) => (
                <tr key={a.slug}>
                  <th scope="row">
                    <a href={`/learn/${a.slug}`} className={styles.rowLink} target="_blank" rel="noreferrer">
                      {a.title}
                    </a>
                    <span className={styles.small}>{tl(`topics.${a.topic}`)}</span>
                  </th>
                  <td>{a.reviewedBy ? <Tag tone="leaf">{t('content.reviewed', { name: a.reviewedBy })}</Tag> : <Tag tone="ember">{t('content.awaiting')}</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.small}>{t('content.howTo')}</p>
      </section>
      <section aria-labelledby="other-h">
        <h2 id="other-h" className={styles.dayTitle}>
          {t('content.other')}
        </h2>
        <ul className={styles.checklist}>
          {OTHER.map(([id, count]) => (
            <li key={id}>
              <FileWarning size={20} strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>{t(`content.items.${id}.title`, { count })}</strong>
                <span className={styles.small}>{t(`content.items.${id}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

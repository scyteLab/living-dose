import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark } from 'lucide-react'
import ItemCard from '@/components/learn/ItemCard'
import styles from '@/components/learn/Learn.module.css'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { LIBRARY } from '@/lib/learn/content'
import { loadSaved } from '@/lib/learn/saved'

export default function SavedPage() {
  const { t } = useTranslation('learn')
  useDocumentTitle(t('savedPage.docTitle'))
  const [items] = useState(() =>
    loadSaved()
      .map((key) => {
        const [kind, id] = key.split(':')
        return LIBRARY.find((i) => i.kind === kind && i.id === id)
      })
      .filter(Boolean),
  )

  return (
    <div className={styles.page}>
      <header className={styles.headText}>
        <h1 className={styles.title}>{t('savedPage.title')}</h1>
        <p className={styles.intro}>{t('savedPage.intro')}</p>
      </header>
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Bookmark size={32} strokeWidth={1.6} />
          </span>
          <p>{t('savedPage.empty')}</p>
          <Button to="/learn">{t('savedPage.browse')}</Button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <ItemCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useDeferredValue, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import PageIntro from '@/components/page/PageIntro'
import Accordion from '@/components/ui/Accordion'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import styles from './Faq.module.css'

export default function Faq() {
  const { t } = useTranslation()
  const { t: tf } = useTranslation('faq')
  useDocumentTitle(t('faqPage.docTitle'))

  const searchId = useId()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const deferredQuery = useDeferredValue(query)

  const categories = tf('categories', { returnObjects: true })

  // Filter by topic and by words in the question or answer
  const groups = useMemo(() => {
    const words = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return Object.entries(categories)
      .filter(([key]) => category === 'all' || category === key)
      .map(([key, { label, items }]) => ({
        key,
        label,
        items: items
          .filter(({ q, a }) => {
            const text = `${q} ${[].concat(a).join(' ')}`.toLowerCase()
            return words.every((w) => text.includes(w))
          })
          .map(({ id, q, a }) => ({ id, question: q, answer: a })),
      }))
      .filter((g) => g.items.length > 0)
  }, [categories, category, deferredQuery])

  const total = groups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className={styles.page}>
      <PageIntro eyebrow={t('faqPage.eyebrow')} title={t('faqPage.title')} intro={t('faqPage.intro')}>
        <div className={styles.search}>
          <label htmlFor={searchId} className="sr-only">
            {t('faqPage.search')}
          </label>
          <Search className={styles.searchIcon} size={20} strokeWidth={2} aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder={t('faqPage.searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label={t('common.clear')}>
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </PageIntro>

      <div className={styles.filters} role="group" aria-label={t('faqPage.filter')}>
        {['all', ...Object.keys(categories)].map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={category === key}
            className={clsx(styles.chip, category === key && styles.chipOn)}
            onClick={() => setCategory(key)}
          >
            {key === 'all' ? t('faqPage.all') : categories[key].label}
          </button>
        ))}
      </div>

      <p className={styles.count} aria-live="polite">
        {total > 0 ? t('faqPage.count', { count: total }) : t('faqPage.empty', { query: deferredQuery })}
      </p>

      <div className={styles.groups}>
        {groups.map((g) => (
          <section key={g.key} className={styles.group} aria-labelledby={`faq-${g.key}`}>
            <h2 id={`faq-${g.key}`} className={styles.groupTitle}>
              {g.label}
            </h2>
            <Accordion items={g.items} />
          </section>
        ))}
      </div>

      <aside className={styles.more}>
        <div>
          <h2 className={styles.moreTitle}>{t('faqPage.moreTitle')}</h2>
          <p className={styles.moreBody}>{t('faqPage.moreBody')}</p>
        </div>
        <Button to="/contact" variant="primary">
          {t('faqPage.moreCta')}
        </Button>
      </aside>
    </div>
  )
}

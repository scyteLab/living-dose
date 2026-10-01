import { useDeferredValue, useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bookmark, Search, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import ItemCard from '@/components/learn/ItemCard'
import styles from '@/components/learn/Learn.module.css'
import { TOPICS } from '@/data/articles'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { loadLatestResult } from '@/lib/healthCheck/storage'
import { articlesForPriorities, LIBRARY, searchLibrary } from '@/lib/learn/content'
import { loadSaved } from '@/lib/learn/saved'

const KINDS = ['all', 'article', 'recipe']

export default function LearnPage() {
  const { t } = useTranslation('learn')
  useDocumentTitle(t('docTitle'), t('metaDescription'))
  const { user } = useAuth()
  const searchId = useId()
  const [params, setParams] = useSearchParams()
  const [forYou, setForYou] = useState([])
  const [savedCount] = useState(() => loadSaved().length)

  const q = params.get('q') ?? ''
  const topic = TOPICS.includes(params.get('topic')) ? params.get('topic') : 'all'
  const kind = KINDS.includes(params.get('kind')) ? params.get('kind') : 'all'
  const query = useDeferredValue(q)

  useEffect(() => {
    if (!user) return
    let alive = true
    loadLatestResult(user.id)
      .then((r) => {
        if (!alive || !r) return
        const slugs = articlesForPriorities(r.results.priorities).map((a) => a.slug)
        setForYou(slugs.map((s) => LIBRARY.find((i) => i.kind === 'article' && i.id === s)))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'all') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const filtering = Boolean(q) || topic !== 'all' || kind !== 'all'
  const results = searchLibrary({ query, topic, kind })
  const featured = !filtering ? LIBRARY.find((i) => i.kind === 'article') : null
  const list = featured ? results.filter((i) => i !== featured && !forYou.includes(i)) : results

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.intro}>{t('intro')}</p>
        </div>
        <div className={styles.headTools}>
          <div className={styles.search}>
            <label htmlFor={searchId} className="sr-only">
              {t('searchLabel')}
            </label>
            <Search className={styles.searchIcon} size={20} strokeWidth={2} aria-hidden="true" />
            <input id={searchId} type="search" placeholder={t('searchPlaceholder')} value={q} onChange={(e) => update({ q: e.target.value })} autoComplete="off" />
            {q && (
              <button type="button" className={styles.searchClear} onClick={() => update({ q: '' })} aria-label={t('clear')}>
                <X size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          <Link to="/learn/saved" className={styles.savedLink}>
            <Bookmark size={18} strokeWidth={2} aria-hidden="true" />
            {savedCount ? t('savedCount', { count: savedCount }) : t('saved')}
          </Link>
        </div>
      </header>

      <nav className={styles.topics} aria-label={t('topics.all')}>
        {['all', ...TOPICS].map((tp) => (
          <button key={tp} type="button" aria-pressed={topic === tp} className={clsx(styles.topic, topic === tp && styles.topicOn)} onClick={() => update({ topic: tp })}>
            {t(`topics.${tp}`)}
          </button>
        ))}
      </nav>

      <div className={styles.kinds} role="group" aria-label={t('kindLabel')}>
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} className={clsx(styles.kindChip, kind === k && styles.kindOn)} onClick={() => update({ kind: k })}>
            {t(`kinds.${k}`)}
          </button>
        ))}
      </div>

      {!filtering && forYou.length > 0 && (
        <section className={styles.forYou} aria-labelledby="foryou-h">
          <div className={styles.sectionHead}>
            <h2 id="foryou-h" className={styles.sectionTitle}>
              <Sparkles size={20} strokeWidth={2} aria-hidden="true" />
              {t('forYou')}
            </h2>
            <p className={styles.muted}>{t('forYouHint')}</p>
          </div>
          <ul className={styles.grid}>
            {forYou.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured && !forYou.includes(featured) && (
        <section aria-label={t('featured')}>
          <ItemCard item={featured} featured />
        </section>
      )}

      <section aria-labelledby="all-h" className={styles.allSection}>
        <div className={styles.sectionHead}>
          <h2 id="all-h" className={styles.sectionTitle}>
            {filtering ? t('count', { count: results.length }) : t('all')}
          </h2>
          {filtering && (
            <button type="button" className={styles.linkButton} onClick={() => setParams({}, { replace: true })}>
              {t('clear')}
            </button>
          )}
        </div>
        {results.length === 0 ? (
          <p className={styles.empty}>{t('empty')}</p>
        ) : (
          <ul className={styles.grid}>
            {list.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BookOpen, Check, Clock, Lightbulb, ShieldCheck, Video } from 'lucide-react'
import { Helpful, SaveButton, ShareButton } from '@/components/learn/Actions'
import Cover from '@/components/learn/Cover'
import ItemCard from '@/components/learn/ItemCard'
import styles from '@/components/learn/Learn.module.css'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import { ARTICLES_BY_SLUG } from '@/data/articles'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { LIBRARY, readingMinutes, relatedArticles } from '@/lib/learn/content'

export default function ArticlePage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation('learn')
  const a = ARTICLES_BY_SLUG[slug]
  useDocumentTitle(a?.title ?? t('docTitle'))

  if (!a) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('article.notFound')}>
          <Link to="/learn">{t('article.back')}</Link>
        </PageIntro>
      </div>
    )
  }

  const fmt = (iso) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  const item = LIBRARY.find((i) => i.kind === 'article' && i.id === slug)
  const related = relatedArticles(slug).map((r) => LIBRARY.find((i) => i.kind === 'article' && i.id === r.slug))

  return (
    <div className={styles.page}>
      <Link to="/learn" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('article.back')}
      </Link>

      <article className={styles.article}>
        <header className={styles.articleHead}>
          <Link to={`/learn?topic=${a.topic}`} className={styles.kind}>
            {t(`topics.${a.topic}`)}
          </Link>
          <h1 className={styles.articleTitle}>{a.title}</h1>
          <p className={styles.articleSummary}>{a.summary}</p>
          <div className={styles.articleMeta}>
            <span className={styles.metaIcon}>
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
              {t('minutesRead', { count: readingMinutes(a) })}
            </span>
            <span>{t('article.updated', { date: fmt(a.updated) })}</span>
            <span className={styles.metaIcon}>
              <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
              {a.reviewedBy ? t('article.reviewed', { name: a.reviewedBy, date: fmt(a.reviewedOn) }) : t('article.pending')}
            </span>
          </div>
          <div className={styles.actions}>
            <SaveButton itemKey={`article:${a.slug}`} title={a.title} />
            <ShareButton title={a.title} text={a.summary} />
          </div>
        </header>

        <Cover item={item} size="wide" />

        <div className={styles.body}>
          {a.sections.map((s) => (
            <section key={s.heading} className={styles.bodySection}>
              <h2>{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.list && (
                <ul>
                  {s.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
              {s.tip && (
                <p className={styles.tip}>
                  <Lightbulb size={18} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <strong>{t('article.tip')}:</strong> {s.tip}
                  </span>
                </p>
              )}
            </section>
          ))}

          <aside className={styles.takeaways} aria-labelledby="takeaways-h">
            <h2 id="takeaways-h">{t('article.takeaways')}</h2>
            <ul>
              {a.takeaways.map((k) => (
                <li key={k}>
                  <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                  {k}
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.sources} aria-labelledby="sources-h">
            <h2 id="sources-h">
              <BookOpen size={18} strokeWidth={2} aria-hidden="true" />
              {t('article.sources')}
            </h2>
            <ul>
              {a.sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p>{t('article.sourcesNote')}</p>
          </section>

          <div className={styles.talk}>
            <div>
              <p className={styles.talkTitle}>{t('article.talk')}</p>
              <p className={styles.muted}>{t('article.talkBody')}</p>
            </div>
            <Button to={a.topic === 'mind' ? '/care?s=psychologist' : '/care'} variant="care" size="sm">
              <Video size={17} strokeWidth={2} aria-hidden="true" />
              {t('article.talkCta')}
            </Button>
          </div>

          <Helpful itemKey={`article:${a.slug}`} />
        </div>
      </article>

      <section aria-labelledby="related-h" className={styles.allSection}>
        <h2 id="related-h" className={styles.sectionTitle}>
          {t('article.related')}
        </h2>
        <ul className={styles.grid}>
          {related.map((r) => (
            <li key={r.id}>
              <ItemCard item={r} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

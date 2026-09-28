import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, FileText } from 'lucide-react'
import clsx from 'clsx'
import PageIntro from './PageIntro'
import styles from './LegalDocument.module.css'

/**
 * Long legal page with a contents list.
 * Desktop: contents stay in view on the left and highlight the section you're reading.
 * Phones: contents fold into a "Contents" button at the top.
 * `doc`: { title, intro, sections: [{ id, title, paragraphs: [], items: [] }] }
 */
export default function LegalDocument({ doc, updated, draftNote }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(doc.sections[0]?.id)

  useEffect(() => {
    const headings = doc.sections.map((s) => document.getElementById(s.id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [doc.sections])

  const contents = (
    <ol className={styles.tocList}>
      {doc.sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className={clsx(styles.tocLink, active === s.id && styles.tocActive)}>
            <span className={styles.tocNum}>{i + 1}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <div className={styles.page}>
      <PageIntro title={doc.title} intro={doc.intro}>
        <p className={styles.updated}>
          <FileText size={16} strokeWidth={2} aria-hidden="true" />
          {t('legalPage.updated', { date: updated })}
        </p>
      </PageIntro>

      {draftNote && (
        <p className={styles.draft} role="note">
          {draftNote}
        </p>
      )}

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label={t('legalPage.contents')}>
          <details className={styles.tocMobile}>
            <summary>
              {t('legalPage.contents')}
              <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
            </summary>
            {contents}
          </details>
          <div className={styles.tocDesktop}>
            <p className={styles.tocTitle}>{t('legalPage.contents')}</p>
            {contents}
          </div>
        </nav>

        <article className={styles.body}>
          {doc.sections.map((s, i) => (
            <section key={s.id} className={styles.section} aria-labelledby={s.id}>
              <h2 id={s.id} className={styles.heading}>
                <span className={styles.headingNum}>{i + 1}.</span> {s.title}
              </h2>
              {s.paragraphs?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.items?.length > 0 && (
                <ul className={styles.items}>
                  {s.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
              {s.after?.map((p, j) => (
                <p key={`after-${j}`}>{p}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}

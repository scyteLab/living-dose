import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Info, Lock } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import { SECTION_IDS, isSectionComplete } from '@/lib/healthCheck/sections'
import useHealthCheck from '@/hooks/useHealthCheck'
import styles from './HealthCheckLayout.module.css'

/**
 * Frame for every question screen:
 *   top: progress and "Save and finish later"
 *   left (desktop): the 7 sections, finished ones clickable
 *   centre: the questions, Back and Continue
 *   right (desktop): live result and "Why we ask"
 * On smaller screens the side columns fold into the page.
 */
export default function HealthCheckLayout({ sectionId, live, onBack, onContinue, canContinue, continueLabel, busy, children }) {
  const { t } = useTranslation('healthCheck')
  const { answers, saveNow } = useHealthCheck()
  const index = SECTION_IDS.indexOf(sectionId)
  const pct = Math.round((index / SECTION_IDS.length) * 100)
  const minutesLeft = Math.max(1, Math.round((SECTION_IDS.length - index) * 0.7))
  const why = t(`sections.${sectionId}.why`, { returnObjects: true })
  const [attempted, setAttempted] = useState(false)

  const whyCard = (
    <>
      {why.map((p) => (
        <p key={p} className={styles.whyText}>
          {p}
        </p>
      ))}
      <span className={styles.source}>{t(`sections.${sectionId}.source`)}</span>
    </>
  )

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" className={styles.logo} aria-label="Living Dose home">
          <Logo size={22} />
        </Link>
        <div className={styles.progress}>
          <div className={styles.progressText}>
            <span>{t('title')}</span>
            <span className={styles.muted}>{t('progress', { pct })}</span>
          </div>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={t('title')}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link to="/health-check" className={styles.saveLater} onClick={saveNow}>
          <Clock size={17} strokeWidth={2} aria-hidden="true" />
          <span>{t('saveLater')}</span>
        </Link>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label={t('sectionsNav')}>
          <div className={styles.sideHead}>
            <p className={styles.sideTitle}>{t('yourCheck')}</p>
            <p className={styles.muted}>{t('sevenSections')}</p>
          </div>
          <ol className={styles.sections}>
            {SECTION_IDS.map((id, i) => {
              const done = i < index || (i !== index && isSectionComplete(id, answers))
              const current = i === index
              const content = (
                <>
                  <span className={styles.dot}>{done && !current ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}</span>
                  {t(`sections.${id}.name`)}
                </>
              )
              return (
                <li key={id}>
                  {done && !current ? (
                    <Link to={`/health-check/${id}`} className={clsx(styles.section, styles.done)}>
                      {content}
                    </Link>
                  ) : (
                    <span className={clsx(styles.section, current && styles.current)} aria-current={current ? 'step' : undefined}>
                      {content}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          <p className={styles.timeLeft}>
            <Clock size={16} strokeWidth={2} aria-hidden="true" />
            {t('minutesLeft', { count: minutesLeft })}
          </p>
          <p className={styles.privacy}>
            <Lock size={18} strokeWidth={2} aria-hidden="true" />
            {t('privacy')}
          </p>
        </nav>

        <main className={styles.main}>
          <form
            className={styles.content}
            onSubmit={(e) => {
              e.preventDefault()
              if (!canContinue) {
                setAttempted(true)
                return
              }
              if (!busy) onContinue()
            }}
            noValidate
          >
            <header className={styles.head}>
              <p className={styles.eyebrow}>{t('sectionOf', { n: index + 1, name: t(`sections.${sectionId}.name`) })}</p>
              <h1 className={styles.title}>{t(`sections.${sectionId}.title`)}</h1>
              <p className={styles.sub}>{t(`sections.${sectionId}.sub`)}</p>
            </header>

            <div className={styles.questions}>{children}</div>

            {live && <div className={styles.liveInline}>{live}</div>}

            <details className={styles.whyInline}>
              <summary>
                <Info size={18} strokeWidth={2} aria-hidden="true" />
                {t('whyTitle')}
                <ChevronDown className={styles.chevron} size={18} strokeWidth={2} aria-hidden="true" />
              </summary>
              <div className={styles.whyInlineBody}>{whyCard}</div>
            </details>

            {attempted && !canContinue && (
              <p className={styles.incomplete} role="alert">
                {t('incomplete')}
              </p>
            )}

            <div className={styles.nav}>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
                {t('back')}
              </Button>
              <Button type="submit" className={styles.next} data-ready={canContinue} disabled={busy} aria-disabled={!canContinue}>
                {continueLabel ?? t('continue')}
                <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
              </Button>
            </div>
          </form>
        </main>

        <aside className={styles.aside}>
          {live}
          <div className={styles.why}>
            <p className={styles.whyHead}>
              <span className={styles.whyIcon}>
                <Info size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              {t('whyTitle')}
            </p>
            {whyCard}
          </div>
        </aside>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, ArrowLeft, ArrowRight, Brain, Check, ClipboardList, Clock, HeartPulse, Ruler, Target, User, Utensils, Wine } from 'lucide-react'
import clsx from 'clsx'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import ScoreRing from '@/components/ui/ScoreRing'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useHealthCheck from '@/hooks/useHealthCheck'
import { PILLAR_COLOUR } from '@/lib/healthCheck/display'
import { SECTION_IDS, firstIncomplete } from '@/lib/healthCheck/sections'
import { loadLatestResult } from '@/lib/healthCheck/storage'
import styles from './HealthCheckIntro.module.css'

const SECTION_ICONS = { about: User, body: Ruler, eating: Utensils, activity: Activity, habits: Wine, mind: Brain, history: HeartPulse }
const EXAMPLE = { eating: 58, activity: 45, body: 72, sleep: 80, mind: 85, habits: 95 }
const GET = [
  { key: 'score', icon: Target, tone: 'ember' },
  { key: 'numbers', icon: Ruler, tone: 'leaf' },
  { key: 'priorities', icon: Check, tone: 'sky' },
]

export default function HealthCheckIntro() {
  const { t, i18n } = useTranslation('healthCheck')
  useDocumentTitle(t('docTitle'))
  const navigate = useNavigate()
  const { user } = useAuth()
  const { answers, hasDraft, savedAt, reset } = useHealthCheck()
  const [latest, setLatest] = useState(null)

  useEffect(() => {
    let alive = true
    loadLatestResult(user.id)
      .then((r) => alive && setLatest(r))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user.id])

  const fmtDate = (iso) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  const resumeAt = firstIncomplete(answers) ?? 'history'

  const startFresh = () => {
    reset()
    navigate(`/health-check/${SECTION_IDS[0]}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" aria-label="Living Dose home" className={styles.logo}>
          <Logo size={22} />
        </Link>
        <Link to="/" className={styles.back}>
          <ArrowLeft size={17} strokeWidth={2} aria-hidden="true" />
          {t('intro.backHome')}
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.copy} aria-labelledby="hc-title">
          <span className={styles.badge}>{t('intro.badge')}</span>
          <h1 id="hc-title" className={styles.title}>
            {t('intro.title')}
          </h1>
          <p className={styles.body}>{t('intro.body')}</p>

          <ul className={styles.chips} aria-label={t('sevenSections')}>
            {SECTION_IDS.map((id) => {
              const Icon = SECTION_ICONS[id]
              return (
                <li key={id}>
                  <Icon size={17} strokeWidth={2} aria-hidden="true" />
                  {t(`sections.${id}.name`)}
                </li>
              )
            })}
          </ul>

          {hasDraft && <p className={styles.draft}>{t('intro.draftSaved', { date: fmtDate(savedAt) })}</p>}

          <div className={styles.actions}>
            {hasDraft ? (
              <>
                <Button to={`/health-check/${resumeAt}`} variant="action" size="lg">
                  {t('intro.resume')}
                  <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
                </Button>
                <Button variant="outline" size="lg" onClick={startFresh}>
                  {t('intro.startAgain')}
                </Button>
              </>
            ) : (
              <Button to={`/health-check/${SECTION_IDS[0]}`} variant="action" size="lg">
                {t('intro.start')}
                <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
              </Button>
            )}
            <span className={styles.stop}>
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
              {t('intro.stopAnyTime')}
            </span>
          </div>

          {latest && (
            <Link to="/health-check/results" className={styles.latest}>
              <ClipboardList size={18} strokeWidth={2} aria-hidden="true" />
              <span>
                {t('intro.lastResults')} <small>{t('intro.lastResultsDate', { date: fmtDate(latest.createdAt) })}</small>
              </span>
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          )}

          <p className={styles.standards}>{t('intro.standards')}</p>
        </section>

        <aside className={styles.side}>
          <div className={styles.example} aria-hidden="true">
            <div className={styles.exampleHead}>
              <ScoreRing value={69} size={108} stroke={10} className={styles.ring} />
              <div>
                <p className={styles.exampleLabel}>{t('intro.exampleLabel')}</p>
                <p className={styles.exampleTitle}>{t('intro.exampleTitle')}</p>
                <p className={styles.exampleBody}>{t('intro.exampleBody')}</p>
              </div>
            </div>
            <ul className={styles.bars}>
              {Object.entries(EXAMPLE).map(([k, v], i) => (
                <li key={k}>
                  <span>{t(`pillars.${k}`)}</span>
                  <span className={styles.track}>
                    <span style={{ width: `${v}%`, background: PILLAR_COLOUR[k], animationDelay: `${300 + i * 90}ms` }} />
                  </span>
                  <span className={styles.barValue}>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.get}>
            <h2 className={styles.getTitle}>{t('intro.getTitle')}</h2>
            <ul>
              {GET.map(({ key, icon: Icon, tone }) => (
                <li key={key}>
                  <span className={clsx(styles.getIcon, styles[tone])} aria-hidden="true">
                    <Icon size={21} strokeWidth={2} />
                  </span>
                  <span>
                    <strong>{t(`intro.get.${key}.title`)}</strong>
                    {t(`intro.get.${key}.body`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}

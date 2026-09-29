import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, RotateCcw, Share2 } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import ResultsHero from '@/components/healthCheck/results/ResultsHero'
import KeyNumbers from '@/components/healthCheck/results/KeyNumbers'
import Priorities from '@/components/healthCheck/results/Priorities'
import Guidance from '@/components/healthCheck/results/Guidance'
import NextSteps from '@/components/healthCheck/results/NextSteps'
import AboutCheck from '@/components/healthCheck/results/AboutCheck'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { loadLatestResult, setReminder } from '@/lib/healthCheck/storage'
import styles from './HealthCheckResults.module.css'

const FOUR_WEEKS = 28 * 24 * 60 * 60 * 1000

export default function HealthCheckResults() {
  const { t, i18n } = useTranslation('healthCheck')
  useDocumentTitle(t('results.docTitle'))
  const { user, firstName } = useAuth()
  const [state, setState] = useState({ status: 'loading', record: null })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let alive = true
    loadLatestResult(user.id)
      .then((record) => alive && setState({ status: record ? 'ready' : 'empty', record }))
      .catch(() => alive && setState({ status: 'error', record: null }))
    return () => {
      alive = false
    }
  }, [user.id])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  if (state.status === 'loading') return <div className={styles.loading} role="status" aria-label={t('results.docTitle')} />
  if (state.status === 'empty') return <Navigate to="/health-check" replace />

  if (state.status === 'error') {
    return (
      <div className={styles.errorPage}>
        <p role="alert">{t('calculating.error')}</p>
        <Link to="/health-check">{t('results.retake')}</Link>
      </div>
    )
  }

  const { record } = state
  const { results, answers } = record
  const created = new Date(record.createdAt)
  const fmt = (d) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  const fmtShort = (d) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(d)
  const dateText = fmt(created)
  const nextDateText = fmtShort(new Date(created.getTime() + FOUR_WEEKS))

  const onRemindChange = async (remind) => {
    setState((s) => ({ ...s, record: { ...s.record, remind } }))
    try {
      await setReminder(user.id, record.id, remind)
    } catch {
      setState((s) => ({ ...s, record: { ...s.record, remind: !remind } }))
    }
  }

  const share = async () => {
    const m = results.measures
    const text = t('results.shareText', {
      date: dateText,
      score: results.score,
      band: t(`results.bands.${results.band}`),
      bmi: m.bmi ? `${m.bmi} (${t(`categories.bmi.${m.bmiCategory}`)})` : t('results.notAvailable'),
      whtr: m.whtr ? `${m.whtr.toFixed(2)} (${t(`categories.whtr.${m.whtrCategory}`)})` : t('results.notAvailable'),
      bp: m.bpCategory ? `${m.systolic}/${m.diastolic} mmHg (${t(`categories.bp.${m.bpCategory}`)})` : t('results.notAvailable'),
      findrisc: m.findrisc.applicable ? `${m.findrisc.points}/26 (${t(`categories.findrisc.${m.findrisc.band}`)})` : t('results.notAvailable'),
    })
    try {
      if (navigator.share) {
        await navigator.share({ title: t('results.shareTitle'), text })
        return
      }
      await navigator.clipboard.writeText(text)
      setToast(t('results.copied'))
    } catch {
      /* the person closed the share sheet */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" aria-label="Living Dose home" className={styles.logo}>
          <Logo size={22} />
        </Link>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => window.print()}>
            <Download size={17} strokeWidth={2} aria-hidden="true" />
            <span>{t('results.download')}</span>
          </button>
          <button type="button" className={styles.action} onClick={share}>
            <Share2 size={17} strokeWidth={2} aria-hidden="true" />
            <span>{t('results.share')}</span>
          </button>
          <Link to="/health-check" className={styles.action}>
            <RotateCcw size={17} strokeWidth={2} aria-hidden="true" />
            <span>{t('results.retake')}</span>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <ResultsHero results={results} answers={answers} firstName={firstName} dateText={dateText} nextDateText={nextDateText} />
        <KeyNumbers measures={results.measures} />
        <Priorities priorities={results.priorities} />
        <Guidance results={results} answers={answers} />
        <NextSteps remind={record.remind !== false} onRemindChange={onRemindChange} nextDateText={nextDateText} />
        <AboutCheck />
      </main>

      {toast && (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useHealthCheck from '@/hooks/useHealthCheck'
import { computeResults } from '@/lib/healthCheck/scoring'
import { allComplete, firstIncomplete } from '@/lib/healthCheck/sections'
import { saveResult } from '@/lib/healthCheck/storage'
import styles from './HealthCheckCalculating.module.css'

const MIN_MS = 2600 // long enough to read the steps, short enough not to annoy

/** Works out and saves the results, showing what's happening, then opens them. */
export default function HealthCheckCalculating() {
  const { t } = useTranslation('healthCheck')
  useDocumentTitle(t('calculating.title'))
  const navigate = useNavigate()
  const { user } = useAuth()
  const { answers, reset } = useHealthCheck()
  const [error, setError] = useState(false)
  const [finished, setFinished] = useState(false) // results saved: the cleared draft no longer matters
  const started = useRef(false)
  const complete = allComplete(answers)
  const steps = t('calculating.steps', { returnObjects: true })

  const run = useCallback(async () => {
    setError(false)
    const startedAt = Date.now()
    try {
      const results = computeResults(answers)
      await saveResult(user.id, answers, results)
      const wait = Math.max(0, MIN_MS - (Date.now() - startedAt))
      setTimeout(() => {
        setFinished(true)
        navigate('/health-check/results', { replace: true })
        reset()
      }, wait)
    } catch {
      setError(true)
    }
  }, [answers, user.id, reset, navigate])

  useEffect(() => {
    if (!complete || finished || started.current) return
    started.current = true
    run()
  }, [complete, finished, run])

  if (!complete && !finished) return <Navigate to={`/health-check/${firstIncomplete(answers)}`} replace />

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" aria-label="Living Dose home">
          <LogoMark size={26} />
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 150 150" className={error ? '' : styles.spin}>
            <circle cx="75" cy="75" r="64" fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle cx="75" cy="75" r="64" fill="none" stroke="var(--leaf)" strokeWidth="12" strokeLinecap="round" strokeDasharray="120 282" />
          </svg>
          <span className={styles.mark}>
            <LogoMark size={40} />
          </span>
        </div>

        <div role="status" className={styles.head}>
          <h1 className={styles.title}>{t('calculating.title')}</h1>
          <p className={styles.sub}>{error ? t('calculating.error') : t('calculating.sub')}</p>
        </div>

        {error ? (
          <Button onClick={run}>{t('calculating.retry')}</Button>
        ) : (
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li key={step} style={{ '--delay': `${250 + i * 420}ms` }}>
                <span className={styles.tick} aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}

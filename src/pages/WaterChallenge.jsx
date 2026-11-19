import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Camera, CheckCircle2, Droplet, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import clsx from 'clsx'
import LiveCamera from '@/components/water/LiveCamera'
import styles from '@/components/water/Water.module.css'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { callVision } from '@/lib/scan/vision'
import { isSupabaseConfigured } from '@/lib/supabase'
import { WATER_GOAL, canLog, loadSelfies, logGlass, todaysWater } from '@/lib/water/challenge'
import { formatLocale } from '@/i18n'

/** /challenges/water: a live selfie drinking water adds a verified glass. */
export default function WaterChallenge() {
  const { t, i18n } = useTranslation('scan')
  useDocumentTitle(t('water.docTitle'))
  const { user } = useAuth()
  const cameraRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraState, setCameraState] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | checking | accepted | rejected | blocked
  const [message, setMessage] = useState('')
  const [water, setWater] = useState(() => todaysWater(user.id))
  const [selfies, setSelfies] = useState(() => loadSelfies(user.id))
  const time = new Intl.DateTimeFormat(formatLocale(i18n.language), { hour: 'numeric', minute: '2-digit' })
  const onState = useCallback((s) => setCameraState(s), [])

  const take = async () => {
    const gate = canLog(selfies, water)
    if (!gate.ok) {
      setPhase('blocked')
      setMessage(gate.reason === 'max' ? t('water.max') : t('water.tooSoon', { count: Math.ceil(gate.waitMs / 60000) }))
      return
    }
    const shot = cameraRef.current?.capture()
    if (!shot) return
    setPhase('checking')
    const result = await callVision('water', shot.image)
    let verified = false
    if (result.status === 'ok') {
      if (!result.data.verified) {
        setPhase('rejected')
        setMessage(result.data.reason || t('water.rejected'))
        return
      }
      verified = true
    } else if (!(result.status === 'unavailable' && !isSupabaseConfigured)) {
      // Live site without a working check: don't count unverified glasses
      setPhase('rejected')
      setMessage(t(result.status === 'unavailable' ? 'water.notSetUp' : 'water.checkFailed'))
      return
    }
    setWater(logGlass(user.id, { thumb: shot.thumb, verified }))
    setSelfies(loadSelfies(user.id))
    setPhase('accepted')
    setMessage(verified ? t('water.accepted') : t('water.demoAccepted'))
    setCameraOn(false)
  }

  const done = water >= WATER_GOAL

  return (
    <div className={styles.page}>
      <Link to="/community?tab=challenges" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('water.back')}
      </Link>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('water.title')}</h1>
        <p className={styles.intro}>{t('water.intro')}</p>
      </header>

      <section className={styles.progress} aria-label={t('water.progressLabel')}>
        <p className={styles.count}>
          <strong>{water}</strong> {t('water.ofGoal', { goal: WATER_GOAL })}
        </p>
        <ol className={styles.glasses}>
          {Array.from({ length: WATER_GOAL }, (_, i) => (
            <li key={i} className={clsx(i < water && styles.glassOn)}>
              <Droplet size={18} strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">{i < water ? t('water.glassDone', { n: i + 1 }) : t('water.glassTodo', { n: i + 1 })}</span>
            </li>
          ))}
        </ol>
        {done && <p className={styles.goalDone}>{t('water.goalDone')}</p>}
      </section>

      <section className={styles.panel} aria-labelledby="selfie-h">
        <h2 id="selfie-h" className={styles.panelTitle}>
          {t('water.selfieTitle')}
        </h2>
        {cameraOn ? (
          <>
            <LiveCamera ref={cameraRef} onState={onState} />
            {cameraState === 'live' && (
              <div className={styles.actions}>
                <Button variant="action" onClick={take} disabled={phase === 'checking'}>
                  {phase === 'checking' ? (
                    <Loader2 size={18} strokeWidth={2.2} className={styles.spin} aria-hidden="true" />
                  ) : (
                    <Camera size={18} strokeWidth={2} aria-hidden="true" />
                  )}
                  {phase === 'checking' ? t('water.checking') : t('water.take')}
                </Button>
                <Button variant="outline" onClick={() => setCameraOn(false)} disabled={phase === 'checking'}>
                  {t('water.stop')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.start}>
            <span className={styles.startIcon} aria-hidden="true">
              <Droplet size={34} strokeWidth={1.8} />
            </span>
            <p className={styles.muted}>{t('water.how')}</p>
            <Button
              variant="action"
              onClick={() => {
                setPhase('idle')
                setMessage('')
                setCameraOn(true)
              }}
            >
              <Camera size={18} strokeWidth={2} aria-hidden="true" />
              {selfies.length ? t('water.next') : t('water.start')}
            </Button>
          </div>
        )}
        {message && (
          <p className={clsx(styles.result, phase === 'accepted' ? styles.ok : styles.no)} role={phase === 'accepted' ? 'status' : 'alert'}>
            {phase === 'accepted' ? (
              <CheckCircle2 size={20} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <XCircle size={20} strokeWidth={2.2} aria-hidden="true" />
            )}
            {message}
          </p>
        )}
        <p className={styles.privacy}>
          <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
          {t('water.privacy')}
        </p>
      </section>

      {selfies.length > 0 && (
        <section aria-labelledby="today-h" className={styles.today}>
          <h2 id="today-h" className={styles.panelTitle}>
            {t('water.today')}
          </h2>
          <ul className={styles.selfies}>
            {selfies.map((s) => (
              <li key={s.at}>
                <img src={s.thumb} alt={t('water.selfieAlt', { time: time.format(new Date(s.at)) })} />
                <span>
                  {time.format(new Date(s.at))}
                  {s.verified && <CheckCircle2 size={14} strokeWidth={2.4} aria-label={t('water.verified')} />}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

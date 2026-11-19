import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BellRing, BellOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { disablePush, enablePush, pushState, sendTestPush } from '@/lib/push/push'
import styles from './Push.module.css'

/**
 * Turn phone notifications on or off for this phone.
 * why: 'checkin' | 'family' | 'settings'. compact hides itself once notifications are on.
 */
export default function PushCard({ userId, why = 'settings', name, compact = false }) {
  const { t } = useTranslation('push')
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  useEffect(() => {
    let alive = true
    pushState()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState('unsupported'))
    return () => {
      alive = false
    }
  }, [])

  if (state === null) return null
  if (compact && (state === 'on' || state === 'unsupported')) return null

  const turnOn = async () => {
    setBusy(true)
    setNote(null)
    try {
      await enablePush(userId)
      setState('on')
    } catch (err) {
      const kind = err.kind ?? 'save'
      if (kind === 'denied' || kind === 'ios-install' || kind === 'unsupported') setState(kind)
      else setNote(t(`states.${kind}`))
    }
    setBusy(false)
  }

  return (
    <section className={styles.card}>
      <p className={styles.title}>
        {state === 'on' ? <BellRing size={20} strokeWidth={2} aria-hidden="true" /> : <BellOff size={20} strokeWidth={2} aria-hidden="true" />}
        {t('title')}
      </p>
      <p className={styles.body}>{t(`why.${why}`, { name })}</p>

      {state === 'on' ? (
        <>
          <p className={styles.ok}>{t('on')}</p>
          {!compact && (
            <div className={styles.row}>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const r = await sendTestPush()
                  setNote(r.sent > 0 ? t('testSent') : t('testNone'))
                }}
              >
                {t('test')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await disablePush().catch(() => {})
                  setState('off')
                  setNote(null)
                }}
              >
                {t('turnOff')}
              </Button>
            </div>
          )}
        </>
      ) : state === 'off' ? (
        <Button size="sm" onClick={turnOn} disabled={busy}>
          {busy ? t('turningOn') : t('turnOn')}
        </Button>
      ) : (
        <p className={styles.hint}>{t(`states.${state}`)}</p>
      )}
      {note && (
        <p className={styles.hint} role="status">
          {note}
        </p>
      )}
    </section>
  )
}

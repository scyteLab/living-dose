import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CircleCheck, MessageCircle, ShieldCheck } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import OtpInput from '@/components/auth/OtpInput'
import Stepper from '@/components/auth/Stepper'
import { SecurityVisual } from '@/components/auth/PanelVisuals'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { RESEND_SECONDS, isDemo, sendCode, verifyCode } from '@/lib/auth'
import { clearPending, getPending } from '@/lib/authFlow'
import { displayPhone } from '@/lib/phone'
import styles from './Auth.module.css'

export default function Verify() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('verify.docTitle'))
  const navigate = useNavigate()
  const [pending] = useState(getPending)

  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | checking | error | success
  const [errorKind, setErrorKind] = useState(null)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const [notice, setNotice] = useState(null)
  const inputRef = useRef(null)

  // Resend countdown
  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  // After a wrong code the input unlocks on the next render; focus it then
  useEffect(() => {
    if (status === 'error') inputRef.current?.focus()
  }, [status])

  if (!pending) return <Navigate to="/sign-in" replace />

  const isSignup = pending.intent === 'signup'
  const destination = pending.channel === 'phone' ? displayPhone(pending.phone) : pending.email

  const verify = async (token) => {
    setStatus('checking')
    setErrorKind(null)
    try {
      await verifyCode({ channel: pending.channel, phone: pending.phone, email: pending.email, token, metadata: pending.metadata })
      setStatus('success')
      clearPending()
      setTimeout(() => navigate(isSignup ? '/onboarding' : pending.from || '/', { replace: true }), 500)
    } catch (err) {
      setStatus('error')
      setErrorKind(err.kind ?? 'generic')
      setCode('')
    }
  }

  const resend = async (via = 'sms') => {
    setNotice(null)
    setErrorKind(null)
    try {
      await sendCode({ channel: pending.channel, phone: pending.phone, email: pending.email, intent: pending.intent, metadata: pending.metadata, via })
      setSeconds(RESEND_SECONDS)
      setCode('')
      setNotice(via === 'whatsapp' ? 'sentWhatsapp' : 'sentAgain')
      inputRef.current?.focus()
    } catch (err) {
      setErrorKind(err.kind ?? 'generic')
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (code.length === 6) verify(code)
    else {
      setErrorKind('codeIncomplete')
      inputRef.current?.focus()
    }
  }

  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  const checking = status === 'checking'

  return (
    <AuthLayout
      back={{ to: isSignup ? '/join' : '/sign-in', label: t('back') }}
      panel={{ title: t('verify.panelTitle'), sub: t('verify.panelSub'), visual: <SecurityVisual /> }}
      footer={
        <>
          {t('verify.trouble')} <Link to="/contact?topic=account">{t('verify.contact')}</Link>
        </>
      }
    >
      {isSignup && <Stepper current={1} />}

      <header className={styles.head}>
        <span className={styles.iconBadge} aria-hidden="true">
          <MessageCircle size={28} strokeWidth={1.8} />
        </span>
        <h1 className={styles.title}>{t('verify.title')}</h1>
        <p className={styles.lead}>
          {t('verify.sentTo')} <strong className={styles.strong}>{destination}</strong>.{' '}
          <Link to={isSignup ? '/join' : '/sign-in'}>{pending.channel === 'phone' ? t('verify.changeNumber') : t('verify.changeEmail')}</Link>
        </p>
        {isDemo && <p className={styles.demoHint}>{t('verify.demoHint')}</p>}
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <OtpInput
          ref={inputRef}
          value={code}
          onChange={(v) => {
            setCode(v)
            if (errorKind) setErrorKind(null)
            if (status === 'error') setStatus('idle')
          }}
          onComplete={verify}
          label={t('verify.codeLabel')}
          error={Boolean(errorKind)}
          disabled={checking || status === 'success'}
          describedBy="verify-status"
        />

        <div id="verify-status" aria-live="polite" className={styles.status}>
          {checking && <p className={styles.hint}>{t('verify.checking')}</p>}
          {status === 'success' && (
            <p className={styles.successText}>
              <CircleCheck size={18} strokeWidth={2.2} aria-hidden="true" />
              {t('verify.success')}
            </p>
          )}
          {errorKind && <p className={styles.errorText}>{t(`errors.${errorKind}`)}</p>}
          {notice && !errorKind && <p className={styles.successText}>{t(`verify.${notice}`)}</p>}
        </div>

        <Button type="submit" size="lg" className={styles.submit} data-ready={code.length === 6} disabled={checking || status === 'success'}>
          {checking ? t('verify.checking') : t('verify.submit')}
          {!checking && <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
        </Button>
      </form>

      <div className={styles.resendBox}>
        {seconds > 0 ? (
          <p>
            {t('verify.resendIn')} <strong className={styles.timer}>{timer}</strong>
          </p>
        ) : (
          <button type="button" className={styles.textButton} onClick={() => resend('sms')}>
            {pending.channel === 'phone' ? t('verify.resendSms') : t('verify.resendEmail')}
          </button>
        )}
        {pending.channel === 'phone' && (
          <button type="button" className={styles.textButtonDark} onClick={() => resend('whatsapp')} disabled={seconds > 0}>
            <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
            {t('verify.whatsapp')}
          </button>
        )}
      </div>

      <p className={styles.safety}>
        <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
        {t('verify.neverShare')}
      </p>
    </AuthLayout>
  )
}

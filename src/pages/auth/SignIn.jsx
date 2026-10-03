import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowRight, Flame, Mail, Smartphone } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import PhoneField from '@/components/auth/PhoneField'
import Segmented from '@/components/auth/Segmented'
import { WelcomeBackVisual } from '@/components/auth/PanelVisuals'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useRegion from '@/hooks/useRegion'
import { phoneAuthEnabled, sendCode } from '@/lib/auth'
import { setPending } from '@/lib/authFlow'
import { COUNTRIES, isValidNational, toE164 } from '@/lib/phone'
import styles from './Auth.module.css'

import { EMAIL_PATTERN } from '@/lib/email'

export default function SignIn() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('signIn.docTitle'))
  const navigate = useNavigate()
  const location = useLocation()
  const { region } = useRegion()

  const [mode, setMode] = useState(phoneAuthEnabled ? 'phone' : 'email')
  const [country, setCountry] = useState(COUNTRIES.some((c) => c.code === region) ? region : 'NG')
  const [digits, setDigits] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null) // { field, kind }
  const [busy, setBusy] = useState(false)
  const phoneRef = useRef(null)
  const emailRef = useRef(null)

  const ready = mode === 'phone' ? isValidNational(digits, country) : EMAIL_PATTERN.test(email.trim())

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) {
      setError({ field: mode, kind: mode === 'phone' ? 'phoneInvalid' : 'emailInvalid' })
      ;(mode === 'phone' ? phoneRef : emailRef).current?.focus()
      return
    }
    setBusy(true)
    setError(null)
    const target = mode === 'phone' ? { phone: toE164(digits, country) } : { email: email.trim() }
    try {
      await sendCode({ channel: mode, ...target, intent: 'signin' })
      setPending({ channel: mode, ...target, intent: 'signin', from: location.state?.from ?? '/' })
      navigate('/verify')
    } catch (err) {
      setError({ field: 'form', kind: err.kind ?? 'generic' })
      setBusy(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError(null)
  }

  const fieldError = error && error.field === mode ? t(`errors.${error.kind}`) : null

  return (
    <AuthLayout
      panel={{ title: t('signIn.panelTitle'), sub: t('signIn.panelSub'), visual: <WelcomeBackVisual /> }}
      mobileIntro={
        <div className={styles.mobileIntro}>
          <p className={styles.mobileIntroTitle}>{t('signIn.panelTitle')}</p>
          <p className={styles.mobileIntroSub}>{t('signIn.panelSub')}</p>
          <span className={styles.mobileStreak}>
            <Flame size={15} strokeWidth={2} aria-hidden="true" />
            {t('signIn.mobileStreak')}
          </span>
        </div>
      }
      footer={<Trans t={t} i18nKey="legalLine" components={{ terms: <Link to="/terms" />, privacy: <Link to="/privacy" /> }} />}
    >
      <header className={styles.head}>
        <h1 className={styles.title}>{t('signIn.title')}</h1>
        <p className={styles.lead}>{t('signIn.lead')}</p>
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {phoneAuthEnabled && (
          <Segmented
            label={t('signIn.methodLabel')}
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'phone', label: t('signIn.phoneTab'), icon: Smartphone },
              { value: 'email', label: t('signIn.emailTab'), icon: Mail },
            ]}
          />
        )}

        {mode === 'phone' ? (
          <PhoneField
            label={t('phone.label')}
            country={country}
            onCountryChange={(c) => {
              setCountry(c)
              setError(null)
            }}
            digits={digits}
            onDigitsChange={(d) => {
              setDigits(d)
              if (error) setError(null)
            }}
            hint={t('signIn.phoneHint')}
            error={fieldError}
            inputRef={phoneRef}
          />
        ) : (
          <div className={styles.field}>
            <label htmlFor="signin-email" className={styles.label}>
              {t('email.label')}
            </label>
            <input
              ref={emailRef}
              id="signin-email"
              className={`${styles.input} ${fieldError ? styles.inputError : ''} ${ready ? styles.inputValid : ''}`}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('email.placeholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby="signin-email-note"
            />
            <p id="signin-email-note" className={fieldError ? styles.errorText : styles.hint}>
              {fieldError ?? t('signIn.emailHint')}
            </p>
          </div>
        )}

        {error?.field === 'form' && (
          <p className={styles.formError} role="alert">
            {t(`errors.${error.kind}`)} {error.kind === 'no_account' && <Link to="/join">{t('signIn.createInstead')}</Link>}
          </p>
        )}

        <Button type="submit" size="lg" className={styles.submit} data-ready={ready} disabled={busy}>
          {busy ? t('sending') : t('signIn.submit')}
          {!busy && <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>{t('signIn.newHere')}</span>
      </div>
      <Button to="/join" variant="outline" size="lg" className={styles.submit}>
        {t('signIn.createAccount')}
      </Button>
    </AuthLayout>
  )
}

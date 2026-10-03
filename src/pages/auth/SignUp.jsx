import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowRight, Lock, Mail, Smartphone } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import PhoneField from '@/components/auth/PhoneField'
import Segmented from '@/components/auth/Segmented'
import Stepper from '@/components/auth/Stepper'
import { BenefitsVisual, FreeBadge } from '@/components/auth/PanelVisuals'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useRegion from '@/hooks/useRegion'
import { phoneAuthEnabled, sendCode } from '@/lib/auth'
import { EMAIL_PATTERN } from '@/lib/email'
import { setPending, setPrefill } from '@/lib/authFlow'
import { COUNTRIES, isValidNational, toE164 } from '@/lib/phone'
import styles from './Auth.module.css'

// Choices made on the landing page (budget planner, Diaspora Care) carry into "About you"
const GOAL_FROM_LANDING = { bloodSugar: 'sugar', heart: 'heart', weight: 'weight', pregnancy: 'pregnancy' }
const HOUSEHOLD_FROM_LANDING = { one: 'me', two: 'family', family: 'family' }

export default function SignUp() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('signUp.docTitle'))
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { region } = useRegion()

  const [name, setName] = useState('')
  const [country, setCountry] = useState(COUNTRIES.some((c) => c.code === region) ? region : 'NG')
  const [digits, setDigits] = useState('')
  const [mode, setMode] = useState(phoneAuthEnabled ? 'phone' : 'email')
  const [email, setEmail] = useState('')
  const [terms, setTerms] = useState(false)
  const [health, setHealth] = useState(false)
  const [news, setNews] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const formRef = useRef(null)

  useEffect(() => {
    const goal = GOAL_FROM_LANDING[params.get('goal')]
    const household = params.get('for') === 'family' ? 'abroad' : HOUSEHOLD_FROM_LANDING[params.get('household')]
    if (goal || household) setPrefill({ goals: goal ? [goal] : [], household: household ?? null })
  }, [params])

  // After a failed submit, move focus to the first thing that needs fixing
  useEffect(() => {
    if (attempts > 0) formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [attempts])

  const nameOk = name.trim().length >= 2
  const phoneOk = isValidNational(digits, country)
  const emailOk = EMAIL_PATTERN.test(email.trim())
  const contactOk = mode === 'phone' ? phoneOk : emailOk
  const ready = nameOk && contactOk && terms && health

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!nameOk) found.name = t('errors.nameMissing')
    if (mode === 'phone' && !phoneOk) found.phone = t('errors.phoneInvalid')
    if (mode === 'email' && !emailOk) found.email = t('errors.emailInvalid')
    if (!terms) found.terms = true
    if (!health) found.health = true
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setAttempts((n) => n + 1)
      return
    }

    setBusy(true)
    setFormError(null)
    const target = mode === 'phone' ? { phone: toE164(digits, country) } : { email: email.trim() }
    const now = new Date().toISOString()
    const metadata = {
      first_name: name.trim(),
      consent_terms_at: now,
      consent_health_at: now,
      marketing_opt_in: news,
    }
    try {
      await sendCode({ channel: mode, ...target, intent: 'signup', metadata })
      setPending({ channel: mode, ...target, intent: 'signup', metadata })
      navigate('/verify')
    } catch (err) {
      setFormError(err.kind ?? 'generic')
      setBusy(false)
    }
  }

  const consentsMissing = errors.terms || errors.health

  return (
    <AuthLayout
      width="md"
      panel={{ title: t('signUp.panelTitle'), sub: t('signUp.panelSub'), visual: <BenefitsVisual />, bottom: <FreeBadge /> }}
      footer={
        <span className={styles.secure}>
          <Lock size={14} strokeWidth={2} aria-hidden="true" />
          {t('signUp.secure')}
        </span>
      }
    >
      <Stepper current={0} />
      <header className={styles.head}>
        <h1 className={styles.title}>{t('signUp.title')}</h1>
        <p className={styles.lead}>{t('signUp.lead')}</p>
      </header>

      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="signup-name" className={styles.label}>
            {t('signUp.nameLabel')}
          </label>
          <input
            id="signup-name"
            className={`${styles.input} ${errors.name ? styles.inputError : ''} ${nameOk ? styles.inputValid : ''}`}
            type="text"
            autoComplete="given-name"
            placeholder={t('signUp.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((x) => ({ ...x, name: undefined }))
            }}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'signup-name-error' : undefined}
          />
          {errors.name && (
            <p id="signup-name-error" className={styles.errorText}>
              {errors.name}
            </p>
          )}
        </div>

        {phoneAuthEnabled && (
          <Segmented
            label={t('signUp.methodLabel')}
            value={mode}
            onChange={(m) => {
              setMode(m)
              setErrors((x) => ({ ...x, phone: undefined, email: undefined }))
              setFormError(null)
            }}
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
            onCountryChange={setCountry}
            digits={digits}
            onDigitsChange={(d) => {
              setDigits(d)
              if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }))
            }}
            hint={t('signUp.phoneHint')}
            error={errors.phone}
          />
        ) : (
          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              {t('email.label')}
            </label>
            <input
              id="signup-email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''} ${emailOk ? styles.inputValid : ''}`}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('email.placeholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
              }}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby="signup-email-note"
            />
            <p id="signup-email-note" className={errors.email ? styles.errorText : styles.hint}>
              {errors.email ?? t('signUp.emailHint')}
            </p>
          </div>
        )}

        <fieldset className={styles.consents}>
          <legend className="sr-only">{t('signUp.consentsLegend')}</legend>
          <Checkbox
            id="consent-terms"
            checked={terms}
            onChange={(v) => {
              setTerms(v)
              setErrors((x) => ({ ...x, terms: undefined }))
            }}
            error={errors.terms}
          >
            <Trans
              t={t}
              i18nKey="signUp.consentTerms"
              components={{ terms: <Link to="/terms" target="_blank" />, privacy: <Link to="/privacy" target="_blank" /> }}
            />
          </Checkbox>
          <Checkbox
            id="consent-health"
            checked={health}
            onChange={(v) => {
              setHealth(v)
              setErrors((x) => ({ ...x, health: undefined }))
            }}
            error={errors.health}
          >
            {t('signUp.consentHealth')} <span className={styles.muted}>{t('signUp.consentHealthNote')}</span>
          </Checkbox>
          <Checkbox id="consent-news" checked={news} onChange={setNews}>
            {t('signUp.consentNews')} <span className={styles.muted}>{t('optional')}</span>
          </Checkbox>
          {consentsMissing && (
            <p className={styles.errorText} role="alert">
              {t('errors.consentsMissing')}
            </p>
          )}
        </fieldset>

        {formError && (
          <p className={styles.formError} role="alert">
            {t(`errors.${formError}`)}
          </p>
        )}

        <Button type="submit" size="lg" className={styles.submit} data-ready={ready} disabled={busy}>
          {busy ? t('sending') : t('signUp.submit')}
          {!busy && <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
        </Button>
      </form>

      <p className={styles.switch}>
        {t('signUp.haveAccount')} <Link to="/sign-in">{t('signUp.signIn')}</Link>
      </p>
    </AuthLayout>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Globe2, User, Users } from 'lucide-react'
import clsx from 'clsx'
import AuthLayout from '@/components/auth/AuthLayout'
import Stepper from '@/components/auth/Stepper'
import { PlanSummaryVisual } from '@/components/auth/PanelVisuals'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { saveProfile } from '@/lib/auth'
import { clearPrefill, getPrefill } from '@/lib/authFlow'
import styles from './Auth.module.css'

const WHO = [
  { id: 'me', icon: User },
  { id: 'family', icon: Users },
  { id: 'abroad', icon: Globe2 },
]

const GOALS = [
  { id: 'eat', tone: 'leaf' },
  { id: 'weight', tone: 'ember' },
  { id: 'sugar', tone: 'sky' },
  { id: 'heart', tone: 'sky' },
  { id: 'pregnancy', tone: 'plum' },
  { id: 'kids', tone: 'leaf' },
  { id: 'energy', tone: 'ember' },
]

export default function Onboarding() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('about.docTitle'))
  const navigate = useNavigate()
  const { user } = useAuth()

  const [prefill] = useState(getPrefill)
  const [who, setWho] = useState(prefill?.household ?? user?.user_metadata?.household ?? null)
  const [goals, setGoals] = useState(prefill?.goals ?? user?.user_metadata?.goals ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showWhoError, setShowWhoError] = useState(false)

  const toggleGoal = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  const chosenGoals = useMemo(
    () => GOALS.filter((g) => goals.includes(g.id)).map((g) => ({ ...g, label: t(`about.goals.${g.id}`) })),
    [goals, t],
  )

  const finish = async () => {
    clearPrefill()
    navigate('/welcome', { replace: true })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!who) {
      setShowWhoError(true)
      document.getElementById('who-me')?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveProfile(user, { household: who, goals })
      finish()
    } catch (err) {
      setError(err.kind ?? 'generic')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      width="lg"
      back={{ to: '/', label: t('backHome') }}
      panel={{
        title: t('about.panelTitle'),
        sub: t('about.panelSub'),
        visual: <PlanSummaryVisual whoLabel={who ? t(`about.who.${who}.title`) : null} goals={chosenGoals} />,
      }}
      footer={t('about.footer')}
    >
      <Stepper current={2} />
      <header className={styles.head}>
        <h1 className={styles.title}>{t('about.title')}</h1>
        <p className={styles.lead}>{t('about.lead')}</p>
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.fieldset}>
          <legend className="sr-only">{t('about.title')}</legend>
          <div className={styles.whoGrid}>
            {WHO.map(({ id, icon: Icon }) => (
              <label key={id} className={clsx(styles.whoCard, who === id && styles.whoOn)}>
                <input
                  id={`who-${id}`}
                  type="radio"
                  name="who"
                  value={id}
                  checked={who === id}
                  onChange={() => {
                    setWho(id)
                    setShowWhoError(false)
                  }}
                  className={styles.whoRadio}
                />
                <span className={styles.whoIcon} aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className={styles.whoText}>
                  <span className={styles.whoTitle}>{t(`about.who.${id}.title`)}</span>
                  <span className={styles.whoBody}>{t(`about.who.${id}.body`)}</span>
                </span>
                <span className={styles.whoCheck} aria-hidden="true">
                  <Check size={13} strokeWidth={3} />
                </span>
              </label>
            ))}
          </div>
          {showWhoError && (
            <p className={styles.errorText} role="alert">
              {t('errors.whoMissing')}
            </p>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.subTitle}>{t('about.goalsTitle')}</legend>
          <div className={styles.goalChips}>
            {GOALS.map(({ id, tone }) => (
              <button
                key={id}
                type="button"
                aria-pressed={goals.includes(id)}
                className={clsx(styles.goalChip, goals.includes(id) && styles[`goal_${tone}`])}
                onClick={() => toggleGoal(id)}
              >
                {goals.includes(id) && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                {t(`about.goals.${id}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className={styles.formError} role="alert">
            {t(`errors.${error}`)}
          </p>
        )}

        <Button type="submit" size="lg" className={styles.submit} data-ready={Boolean(who)} disabled={busy}>
          {busy ? t('saving') : t('about.submit')}
          {!busy && <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
        </Button>
      </form>

      <Link to="/welcome" className={styles.skip} onClick={clearPrefill}>
        {t('about.skip')}
      </Link>
    </AuthLayout>
  )
}

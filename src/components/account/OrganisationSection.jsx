import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { joinWithCode, leave, myOrganisation } from '@/lib/org/service'
import styles from './Account.module.css'

/** Join a sponsoring organisation with its code, see what's shared, or leave. */
export default function OrganisationSection({ user }) {
  const { t, i18n } = useTranslation('org')
  const id = useId()
  const [membership, setMembership] = useState(undefined) // undefined while loading
  const [version, setVersion] = useState(0)
  const [code, setCode] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    myOrganisation(user.id)
      .then((m) => alive && setMembership(m))
      .catch(() => alive && setMembership(null))
    return () => {
      alive = false
    }
  }, [user.id, version])

  if (membership === undefined) return <section className={styles.section} aria-busy="true" />
  const org = membership?.org ?? null

  if (org) {
    return (
      <section className={styles.section} aria-labelledby="org-h">
        <h2 id="org-h" className={styles.sectionTitle}>
          {t('member.title')}
        </h2>
        <div className={styles.callout}>
          <Building2 size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className={styles.calloutText}>
            <p className={styles.label}>{t('member.joined', { name: org.name })}</p>
            <p className={styles.small}>{t('member.joinedOn', { date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(membership.joinedAt)) })}</p>
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>
            <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
            {t('member.whatShared')}
          </p>
          <p className={styles.small}>{t('member.whatSharedBody')}</p>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {t(`member.errors.${error}`)}
          </p>
        )}
        <button
          type="button"
          className={styles.textLink}
          onClick={() => {
            if (!window.confirm(t('member.leaveConfirm', { name: org.name }))) return
            leave(user.id)
              .then(() => {
                setError(null)
                setMembership(null)
                setNotice(t('member.left'))
              })
              .catch(() => setError('failed'))
          }}
        >
          {t('member.leave')}
        </button>
      </section>
    )
  }

  return (
    <form
      className={styles.section}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        const result = await joinWithCode(user.id, code, consent).catch(() => ({ ok: false, reason: 'failed' }))
        setBusy(false)
        if (!result.ok) {
          setError(result.reason)
          return
        }
        setError(null)
        setNotice(null)
        setVersion((v) => v + 1)
      }}
    >
      <div>
        <h2 className={styles.sectionTitle}>{t('member.title')}</h2>
        <p className={styles.muted}>{t('member.intro')}</p>
      </div>
      {notice && (
        <p className={styles.saved} role="status">
          {notice}
        </p>
      )}
      <div className={styles.block}>
        <label htmlFor={id} className={styles.label}>
          {t('member.code')}
        </label>
        <input
          id={id}
          className={styles.codeInput}
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder={t('member.codePlaceholder')}
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={error === 'code' || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
      </div>
      <Checkbox
        checked={consent}
        onChange={(value) => {
          setConsent(value)
          setError(null)
        }}
      >
        {t('member.consent')}
      </Checkbox>
      {error && (
        <p id={`${id}-err`} className={styles.error} role="alert">
          {t(`member.errors.${error}`)}
        </p>
      )}
      <Button type="submit" className={styles.selfStart} disabled={busy}>
        {t('member.join')}
      </Button>
    </form>
  )
}

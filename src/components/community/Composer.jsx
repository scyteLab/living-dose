import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeartHandshake, PhoneCall } from 'lucide-react'
import Button from '@/components/ui/Button'
import { GROUPS, GROUPS_BY_ID } from '@/data/community'
import useAuth from '@/hooks/useAuth'
import { checkPost, MAX_LENGTH } from '@/lib/community/safety'
import styles from './Community.module.css'

/** Shown before posting when a post mentions self-harm. The member chooses what to do. */
function CrisisPanel({ onPostAnyway, onEdit }) {
  const { t } = useTranslation('community')
  return (
    <div className={styles.crisis} role="alert">
      <p className={styles.crisisTitle}>
        <HeartHandshake size={22} strokeWidth={2} aria-hidden="true" />
        {t('crisis.title')}
      </p>
      <p>{t('crisis.body')}</p>
      <div className={styles.crisisActions}>
        <a href="tel:112" className={styles.crisisCall}>
          <PhoneCall size={18} strokeWidth={2} aria-hidden="true" />
          {t('crisis.call')}
        </a>
        <Button to="/care?s=psychologist" variant="care" size="sm">
          {t('crisis.talk')}
        </Button>
      </div>
      <p className={styles.small}>{t('crisis.callBody')}</p>
      <div className={styles.crisisLinks}>
        <button type="button" className={styles.linkButton} onClick={onEdit}>
          {t('crisis.edit')}
        </button>
        <button type="button" className={styles.linkButton} onClick={onPostAnyway}>
          {t('crisis.postAnyway')}
        </button>
      </div>
    </div>
  )
}

/**
 * New post (choose a group) or reply (group fixed). Validates length and private
 * details, and shows support first if the text mentions self-harm.
 */
export default function Composer({ mode = 'post', group, onSubmit }) {
  const { t } = useTranslation('community')
  const { user } = useAuth()
  const location = useLocation()
  const id = useId()
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState(group ?? GROUPS[0].id)
  const [anon, setAnon] = useState(false)
  const [error, setError] = useState(null)
  const [crisis, setCrisis] = useState(false)
  const [done, setDone] = useState(false)

  if (!user) {
    return (
      <div className={styles.composerGuest}>
        <p>{mode === 'reply' ? t('composer.signInReply') : t('composer.signIn')}</p>
        <Button to="/sign-in" state={{ from: location.pathname }} size="sm">
          {mode === 'reply' ? t('composer.signInReply') : t('composer.signIn')}
        </Button>
      </div>
    )
  }

  const forcedAnon = GROUPS_BY_ID[groupId]?.anonymous
  const send = () => {
    onSubmit({ group: groupId, body, anonymous: forcedAnon || anon })
    setBody('')
    setCrisis(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  const submit = (e) => {
    e.preventDefault()
    const result = checkPost(body)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setError(null)
    if (result.crisis) setCrisis(true)
    else send()
  }

  return (
    <form className={styles.composer} onSubmit={submit} noValidate>
      {mode === 'post' && <p className={styles.composerTitle}>{t('composer.title')}</p>}
      <label htmlFor={id} className="sr-only">
        {mode === 'reply' ? t('composer.reply') : t('composer.title')}
      </label>
      <textarea
        id={id}
        rows={mode === 'reply' ? 3 : 4}
        value={body}
        maxLength={MAX_LENGTH + 50}
        placeholder={mode === 'reply' ? t('composer.replyPlaceholder') : t('composer.placeholder')}
        onChange={(e) => {
          setBody(e.target.value)
          if (error) setError(null)
          if (crisis) setCrisis(false)
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`} className={error ? styles.error : styles.small} role={error ? 'alert' : undefined}>
        {error ? t(`composer.errors.${error}`) : t('composer.reminder')}
      </p>

      {crisis ? (
        <CrisisPanel onPostAnyway={send} onEdit={() => setCrisis(false)} />
      ) : (
        <div className={styles.composerBar}>
          {mode === 'post' && (
            <label className={styles.groupSelect}>
              <span>{t('composer.group')}</span>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={Boolean(group)}>
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {t(`groups.${g.id}.name`)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {forcedAnon ? (
            <span className={styles.small}>{t('composer.anonymousForced')}</span>
          ) : (
            <label className={styles.anon}>
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
              {t('composer.anonymous')}
            </label>
          )}
          <span className={styles.charCount} aria-hidden="true">
            {t('composer.count', { count: body.length, max: MAX_LENGTH })}
          </span>
          <Button type="submit" size="sm" data-ready={body.trim().length >= 10}>
            {mode === 'reply' ? t('composer.reply') : t('composer.post')}
          </Button>
        </div>
      )}
      {done && (
        <p className={styles.posted} role="status">
          {mode === 'reply' ? t('composer.replied') : t('composer.posted')}
        </p>
      )}
      {mode === 'post' && (
        <p className={styles.small}>
          <Link to="/community/guidelines">{t('guidelinesLink')}</Link>
        </p>
      )}
    </form>
  )
}

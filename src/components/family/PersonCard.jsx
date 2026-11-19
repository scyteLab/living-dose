import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, CircleCheck, Clock, Droplet, Flame, HeartPulse, PhoneCall, Thermometer } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import { FEELING_EMOJI } from '@/components/checkin/parts'
import { cleanPhone, validPhone } from '@/lib/simple/view'
import styles from './Family.module.css'

const ICON = { urgent: CircleAlert, unwell: Thermometer, ok: CircleCheck, notYet: Clock, quiet: Clock }

/** One person a helper looks after: today's status first, then the facts. */
export default function PersonCard({ person, phone, onSavePhone, onStop }) {
  const { t } = useTranslation('family')
  const tc = useTranslation('checkin').t
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [value, setValue] = useState(phone ?? '')
  const name = person.ownerName
  const Icon = ICON[person.status]

  const statusText =
    person.status === 'quiet'
      ? person.daysSince === null
        ? t('status.quietNever', { name })
        : t('status.quiet', { name, count: person.daysSince })
      : t(`status.${person.status}`, { name })
  const body =
    person.status === 'urgent'
      ? t('urgentBody', { what: person.urgent.map((u) => t(`urgentWhat.${u}`)).join(', ') })
      : person.status === 'unwell'
        ? t('unwellBody')
        : person.status === 'quiet'
          ? t('quietBody')
          : null

  return (
    <li className={styles.card}>
      <p className={styles.name}>{name}</p>
      <div className={clsx(styles.status, styles[`s_${person.status}`])} role={person.status === 'urgent' ? 'alert' : undefined}>
        <Icon size={22} strokeWidth={2.2} aria-hidden="true" />
        <div>
          {statusText}
          {body && <p>{body}</p>}
        </div>
      </div>

      <ul className={styles.facts}>
        {person.today && (
          <li>
            <span aria-hidden="true">{FEELING_EMOJI[person.today.feeling]}</span>
            {t('feltToday', { feeling: tc(`feelings.${person.today.feeling}`) })}
          </li>
        )}
        <li>
          <Droplet size={16} strokeWidth={2.2} color="var(--sky)" aria-hidden="true" />
          {t('water', { count: person.waterToday })}
        </li>
        <li>
          <Flame size={16} strokeWidth={2.2} color="var(--ember)" aria-hidden="true" />
          {person.streak.count ? t('streak', { count: person.streak.count }) : t('noStreak')}
        </li>
        <li>
          <HeartPulse size={16} strokeWidth={2.2} color="var(--leaf-deep)" aria-hidden="true" />
          {person.score != null ? t('score', { score: person.score }) : t('noScore')}
        </li>
      </ul>

      <div className={styles.actions}>
        {phone && (
          <a href={`tel:${phone}`} className={clsx(styles.callBtn, person.status === 'urgent' && styles.callUrgent)}>
            <PhoneCall size={18} strokeWidth={2.2} aria-hidden="true" />
            {t('callThem', { name })}
          </a>
        )}
        {person.status === 'urgent' && (
          <a href="tel:112" className={clsx(styles.callBtn, styles.callUrgent)}>
            <PhoneCall size={18} strokeWidth={2.2} aria-hidden="true" />
            {t('call112')}
          </a>
        )}
        {!phone && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {t('addPhone')}
          </Button>
        )}
      </div>

      {editing && (
        <form
          className={styles.phoneForm}
          onSubmit={(e) => {
            e.preventDefault()
            if (!validPhone(value)) return
            onSavePhone(cleanPhone(value))
            setEditing(false)
          }}
        >
          <label>
            {t('phoneLabel', { name })}
            <input type="tel" inputMode="tel" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0803 123 4567" />
          </label>
          <Button type="submit" size="sm" disabled={!validPhone(value)}>
            {t('savePhone')}
          </Button>
        </form>
      )}

      {confirming ? (
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={onStop}>
            {t('stopConfirm')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
            {t('keep')}
          </Button>
        </div>
      ) : (
        <button type="button" className={styles.linkButton} onClick={() => setConfirming(true)}>
          {t('stopHelping', { name })}
        </button>
      )}
    </li>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import clsx from 'clsx'
import Segmented from '@/components/auth/Segmented'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { care } from '@/config/care'
import useAuth from '@/hooks/useAuth'
import { bookAppointment, bookedSlots } from '@/lib/care/appointments'
import { availableDays } from '@/lib/care/availability'
import { formatDateChip, formatDay, formatTime, viewerDiffers } from '@/lib/care/format'
import { loadLatestResult } from '@/lib/healthCheck/storage'
import { formatPrice } from '@/lib/shop/money'
import styles from './Care.module.css'

const TOPICS = ['plan', 'results', 'condition', 'weight', 'mood', 'other']

/** Choose a type, day and time, then book. Guests are sent to sign in and brought back. */
export default function BookingPanel({ professional: p }) {
  const { t, i18n } = useTranslation('care')
  const locale = i18n.language
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [type, setType] = useState(p.types[0])
  const [booked, setBooked] = useState(bookedSlots)
  const days = useMemo(() => availableDays(p, { booked }), [p, booked])
  const [date, setDate] = useState(days[0]?.date ?? null)
  const [slot, setSlot] = useState(null)
  const [topic, setTopic] = useState(p.specialty === 'psychologist' ? 'mood' : 'plan')
  const [note, setNote] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [share, setShare] = useState(true)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let alive = true
    loadLatestResult(user.id)
      .then((r) => alive && setHasResults(Boolean(r)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  const day = days.find((d) => d.date === date)
  const who = p.name.replace(/^Dr\s+/, 'Dr ')

  const onBook = async () => {
    if (!user) {
      navigate('/sign-in', { state: { from: location.pathname } })
      return
    }
    if (!slot) {
      setError('time')
      return
    }
    setStatus('booking')
    setError(null)
    try {
      const appt = await bookAppointment(user.id, { professionalId: p.id, type, start: slot, topic, note, shareResults: hasResults && share })
      navigate(`/care/appointments/${appt.id}`, { state: { justBooked: true } })
    } catch (err) {
      setStatus('idle')
      if (err.kind === 'taken') {
        setBooked(bookedSlots())
        setSlot(null)
        setError('taken')
      } else setError('generic')
    }
  }

  return (
    <section className={styles.booking} aria-labelledby="book-title">
      <h2 id="book-title" className={styles.bookingTitle}>
        {t('book.title')}
      </h2>

      <div className={styles.bookBlock}>
        <p className={styles.bookLabel}>{t('book.type')}</p>
        <Segmented
          label={t('book.type')}
          value={type}
          onChange={setType}
          options={p.types.map((ty) => ({ value: ty, label: t(`types.${ty}`) }))}
        />
        <p className={styles.fee}>
          {formatPrice(p.fees[type])} · {t('book.minutes', { count: care.slotMinutes })}
        </p>
      </div>

      <div className={styles.bookBlock}>
        <p className={styles.bookLabel} id="day-label">
          {t('book.date')}
        </p>
        <div className={styles.dateChips} role="radiogroup" aria-labelledby="day-label">
          {days.map((d) => {
            const c = formatDateChip(d.date, locale)
            const on = d.date === date
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={on}
                className={clsx(styles.dateChip, on && styles.dateOn)}
                onClick={() => {
                  setDate(d.date)
                  setSlot(null)
                }}
              >
                <span>{c.weekday}</span>
                <strong>{c.day}</strong>
                <span>{c.month}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.bookBlock}>
        <p className={styles.bookLabel} id="time-label">
          {t('book.time')}
        </p>
        <p className={styles.hint}>{t('book.timesIn')}</p>
        {day ? (
          <div className={styles.times} role="radiogroup" aria-labelledby="time-label">
            {day.slots.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={slot === s}
                className={clsx(styles.time, slot === s && styles.timeOn)}
                onClick={() => {
                  setSlot(s)
                  setError(null)
                }}
              >
                {formatTime(s, locale)}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.hint}>{t('book.noTimes')}</p>
        )}
        {slot && viewerDiffers(slot) && (
          <p className={styles.hint}>{t('book.yourTime', { time: formatTime(slot, locale, Intl.DateTimeFormat().resolvedOptions().timeZone) })}</p>
        )}
      </div>

      <Field label={t('book.topic')}>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((tp) => (
            <option key={tp} value={tp}>
              {t(`book.topics.${tp}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('book.note')} hint={t('book.noteHint')}>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      {hasResults && (
        <label className={styles.share}>
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          <span>
            {t('book.share', { name: who })}
            <small>{t('book.shareHint')}</small>
          </span>
        </label>
      )}

      <div className={styles.bookSummary}>
        {slot && (
          <p className={styles.bookWhen}>
            {formatDay(slot, locale)}, {formatTime(slot, locale)} · {t(`typesLong.${type}`)}
          </p>
        )}
        <p className={styles.payNote}>
          <Info size={16} strokeWidth={2} aria-hidden="true" />
          {t('book.payment')}
        </p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {t(`book.errors.${error}`)}
        </p>
      )}

      <Button variant="care" className={styles.full} onClick={onBook} disabled={status === 'booking'} data-ready={Boolean(slot) || !user}>
        {!user
          ? t('book.signIn')
          : status === 'booking'
            ? t('book.booking')
            : slot
              ? t('book.submit', { time: formatTime(slot, locale) })
              : t('book.submitEmpty')}
      </Button>
      <p className={styles.policy}>{t('book.policy', { hours: care.freeCancellationHours })}</p>
    </section>
  )
}

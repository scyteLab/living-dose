import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, CircleCheck, Clock, Video } from 'lucide-react'
import Avatar from '@/components/care/Avatar'
import styles from '@/components/care/Care.module.css'
import PageIntro from '@/components/page/PageIntro'
import ConsultationSummary from '@/components/care/ConsultationSummary'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { care } from '@/config/care'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { cancelAppointment, freeToCancel, getAppointment, joinState, toIcs } from '@/lib/care/appointments'
import { formatDay, formatTime, relativeWhen, viewerDiffers } from '@/lib/care/format'
import { formatPrice } from '@/lib/shop/money'

export default function AppointmentPage() {
  const { appointmentId } = useParams()
  const { t, i18n } = useTranslation('care')
  const locale = i18n.language
  useDocumentTitle(t('appt.docTitle', { id: appointmentId }))
  const { user, firstName } = useAuth()
  const location = useLocation()
  const [appt, setAppt] = useState(undefined)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let alive = true
    getAppointment(user.id, appointmentId).then((a) => alive && setAppt(a))
    return () => {
      alive = false
    }
  }, [user.id, appointmentId])

  // Keep the Join button up to date
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  if (appt === undefined) return <div className={styles.loading} role="status" />
  if (!appt) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('appt.notFound')}>
          <Link to="/care/appointments">{t('appt.all')}</Link>
        </PageIntro>
      </div>
    )
  }

  const p = PROFESSIONALS_BY_ID[appt.professionalId]
  const typeLabel = t(`typesLong.${appt.type}`)
  const state = joinState(appt, now)
  const whenText = `${formatDay(appt.start, locale)}, ${formatTime(appt.start, locale)} (WAT)`
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const downloadIcs = () => {
    const ics = toIcs(appt, {
      title: t('appt.calendarTitle', { type: typeLabel, name: p.name }),
      description: t('appt.calendarBody', { id: appt.id }),
    })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `living-dose-${appt.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doCancel = async () => {
    const updated = await cancelAppointment(user.id, appt.id)
    setAppt(updated)
    setConfirming(false)
    setNotice(t('appt.cancelledNotice'))
  }

  return (
    <div className={styles.page}>
      {location.state?.justBooked && appt.status === 'booked' && (
        <div className={styles.bookedBanner} role="status">
          <CircleCheck size={28} strokeWidth={2} aria-hidden="true" />
          <p>{firstName ? t('appt.bookedNamed', { name: firstName }) : t('appt.booked')}</p>
        </div>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <div className={styles.apptLayout}>
        <section className={styles.apptCard} aria-labelledby="appt-title">
          <div className={styles.apptHead}>
            <Avatar professional={p} size="lg" />
            <div>
              <p className={styles.eyebrow}>
                {t('appt.ref')}: {appt.id}
              </p>
              <h1 id="appt-title" className={styles.apptTitle}>
                {t('appt.with', { type: typeLabel, name: p.name })}
              </h1>
              <p className={styles.cardTitle}>{p.title}</p>
            </div>
          </div>

          <dl className={styles.apptFacts}>
            <div>
              <dt>{t('appt.when')}</dt>
              <dd>
                {whenText}
                {viewerDiffers(appt.start) && <small> · {t('book.yourTime', { time: formatTime(appt.start, locale, localTz) })}</small>}
              </dd>
            </div>
            <div>
              <dt>{t('book.type')}</dt>
              <dd>
                {typeLabel} · {t('appt.duration', { count: appt.minutes })}
              </dd>
            </div>
            <div>
              <dt>{t('appt.topic')}</dt>
              <dd>{t(`book.topics.${appt.topic}`)}</dd>
            </div>
            <div>
              <dt>{t('appt.sharing')}</dt>
              <dd>{appt.shareResults ? t('appt.sharingOn') : t('appt.sharingOff')}</dd>
            </div>
            <div>
              <dt>{t('appt.fee')}</dt>
              <dd>{formatPrice(appt.fee)}</dd>
            </div>
          </dl>

          <div className={styles.joinBox}>
            {state === 'open' && (
              <Button variant="care" className={styles.full}>
                <Video size={18} strokeWidth={2} aria-hidden="true" />
                {t('appt.join')}
              </Button>
            )}
            {state === 'waiting' && (
              <>
                <p className={styles.joinWhen}>
                  <Clock size={18} strokeWidth={2} aria-hidden="true" />
                  {t('appt.joinSoon', { time: relativeWhen(appt.start, locale, t, now) })}
                </p>
                <p className={styles.hint}>{t('appt.joinOpens')}</p>
              </>
            )}
            {state === 'ended' && <p className={styles.hint}>{t('appt.ended')}</p>}
            {state === 'cancelled' && <p className={styles.cancelledText}>{t('appt.cancelled')}</p>}
          </div>

          {appt.status === 'booked' && state === 'waiting' && (
            <div className={styles.apptActions}>
              <Button variant="outline" onClick={downloadIcs}>
                <CalendarPlus size={18} strokeWidth={2} aria-hidden="true" />
                {t('appt.calendar')}
              </Button>
              <button type="button" className={styles.linkDanger} onClick={() => setConfirming(true)}>
                {t('appt.cancel')}
              </button>
            </div>
          )}
          {appt.summary && <ConsultationSummary summary={appt.summary} professional={p} />}
        </section>

        <aside className={styles.apptSide}>
          {appt.status === 'booked' && state !== 'ended' && (
            <div className={styles.prepare}>
              <h2 className={styles.sectionTitle}>{t('appt.prepareTitle')}</h2>
              <ul>
                {t('appt.prepare', { returnObjects: true }).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.payBox}>
            <p className={styles.bookLabel}>{t('appt.payment')}</p>
            <p>{t('appt.paymentNote')}</p>
          </div>
          <p className={styles.hint}>
            {t('appt.help')} <Link to="/contact?topic=consultation">{t('appt.contact')}</Link>
          </p>
          <Link to="/care/appointments" className={styles.back}>
            {t('appt.all')}
          </Link>
        </aside>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('appt.cancelTitle')}
        description={t('appt.cancelBody', { name: p.name, time: whenText })}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {t('appt.keep')}
            </Button>
            <Button variant="primary" onClick={doCancel} className={styles.dangerButton}>
              {t('appt.cancelConfirm')}
            </Button>
          </>
        }
      >
        {!freeToCancel(appt, now) && <p className={styles.warning}>{t('appt.cancelLate', { hours: care.freeCancellationHours })}</p>}
      </Dialog>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { CalendarPlus, Clock, Video } from 'lucide-react'
import Avatar from '@/components/care/Avatar'
import Button from '@/components/ui/Button'
import { care } from '@/config/care'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import { joinState, toIcs } from '@/lib/care/appointments'
import { formatTime, relativeWhen } from '@/lib/care/format'
import CardHead from './CardHead'
import styles from './Dashboard.module.css'

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export default function NextConsultation({ appt }) {
  const { t, i18n } = useTranslation('dashboard')
  const tc = useTranslation('care').t

  if (!appt) {
    return (
      <section className={styles.card} aria-labelledby="appt-h">
        <CardHead id="appt-h" title={t('appt.title')} />
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('appt.none')}</p>
          <p className={styles.muted}>{t('appt.noneBody')}</p>
          <Button to="/care" variant="care" size="sm">
            {t('appt.noneCta')}
          </Button>
        </div>
      </section>
    )
  }

  const p = PROFESSIONALS_BY_ID[appt.professionalId]
  const typeLabel = tc(`typesLong.${appt.type}`)
  const state = joinState(appt)
  const opens = new Date(new Date(appt.start).getTime() - care.joinOpensMinutesBefore * 6e4).toISOString()

  const downloadIcs = () => {
    const ics = toIcs(appt, { title: tc('appt.calendarTitle', { type: typeLabel, name: p.name }), description: tc('appt.calendarBody', { id: appt.id }) })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `living-dose-${appt.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={styles.card} aria-labelledby="appt-h">
      <CardHead id="appt-h" title={t('appt.title')} link={t('appt.all')} to="/care/appointments" />
      <div className={styles.apptWho}>
        <Avatar professional={p} />
        <div>
          <p className={styles.apptName}>{t('appt.with', { type: typeLabel, name: p.name })}</p>
          <p className={styles.muted}>
            {p.title} · {t('appt.topic', { topic: tc(`book.topics.${appt.topic}`).toLowerCase() })}
          </p>
        </div>
      </div>
      <div className={styles.apptWhen}>
        <p className={styles.apptTime}>
          <Clock size={18} strokeWidth={2} aria-hidden="true" />
          {capitalise(relativeWhen(appt.start, i18n.language, tc))} (WAT)
        </p>
        <p className={styles.apptHint}>{t('appt.joinFrom')}</p>
      </div>
      <div className={styles.apptActions}>
        {state === 'open' ? (
          <Button to={`/care/appointments/${appt.id}`} variant="care" className={styles.grow}>
            <Video size={18} strokeWidth={2} aria-hidden="true" />
            {t('appt.join')}
          </Button>
        ) : (
          <Button to={`/care/appointments/${appt.id}`} variant="outline" className={styles.grow}>
            {t('appt.joinAt', { time: formatTime(opens, i18n.language) })}
          </Button>
        )}
        <button type="button" className={styles.roundButton} onClick={downloadIcs} aria-label={t('appt.calendar')}>
          <CalendarPlus size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {appt.shareResults && <p className={styles.small}>{t('appt.sharing')}</p>}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import Avatar from '@/components/care/Avatar'
import styles from '@/components/care/Care.module.css'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { joinState, listAppointments } from '@/lib/care/appointments'
import { relativeWhen } from '@/lib/care/format'

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation('care')
  useDocumentTitle(t('appts.docTitle'))
  const { user } = useAuth()
  const [list, setList] = useState(null)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    let alive = true
    listAppointments(user.id).then((l) => alive && setList(l))
    return () => {
      alive = false
    }
  }, [user.id])

  if (!list) return <div className={styles.loading} role="status" />

  const now = new Date()
  const upcoming = list.filter((a) => a.status === 'booked' && joinState(a, now) !== 'ended').sort((a, b) => a.start.localeCompare(b.start))
  const past = list.filter((a) => !upcoming.includes(a)).sort((a, b) => b.start.localeCompare(a.start))
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('appts.title')}</h1>
      <div className={styles.apptTabs} role="tablist" aria-label={t('appts.title')}>
        {['upcoming', 'past'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx(styles.tab, tab === id && styles.tabOn)} onClick={() => setTab(id)}>
            {t(`appts.${id}`)} ({id === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <CalendarDays size={32} strokeWidth={1.6} />
          </span>
          <p>{tab === 'upcoming' ? t('appts.emptyUpcoming') : t('appts.emptyPast')}</p>
          <Button to="/care" variant="care">
            {t('appts.find')}
          </Button>
        </div>
      ) : (
        <ul className={styles.apptList} role="tabpanel">
          {shown.map((a) => {
            const p = PROFESSIONALS_BY_ID[a.professionalId]
            const status = a.status === 'cancelled' ? 'cancelled' : joinState(a, now) === 'ended' ? 'ended' : 'booked'
            return (
              <li key={a.id}>
                <Link to={`/care/appointments/${a.id}`} className={styles.apptRow}>
                  <Avatar professional={p} size="sm" />
                  <span className={styles.apptRowMain}>
                    <strong>{t('appt.with', { type: t(`typesLong.${a.type}`), name: p.name })}</strong>
                    <span>{relativeWhen(a.start, i18n.language, t, now)} (WAT)</span>
                  </span>
                  <Tag tone={status === 'booked' ? 'sky' : status === 'cancelled' ? 'berry' : 'neutral'}>{t(`appts.status.${status}`)}</Tag>
                  <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

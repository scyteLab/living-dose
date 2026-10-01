import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import Tag from '@/components/ui/Tag'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatDay, formatTime } from '@/lib/care/format'
import { listAllAppointments, setAppointmentStatus } from '@/lib/staff/api'

const TONE = { booked: 'sky', completed: 'leaf', no_show: 'ember', cancelled: 'berry' }

export default function StaffAppointments() {
  const { t, i18n } = useTranslation('staff')
  const tc = useTranslation('care').t
  useDocumentTitle(t('appointments.title'))
  const { data: all, refresh, staff, storage } = useStaffData(listAllAppointments)
  const [tab, setTab] = useState('upcoming')
  const [now] = useState(() => Date.now())
  const isPast = (a) => new Date(a.start).getTime() + a.minutes * 60000 < now
  const list = tab === 'upcoming' ? all.filter((a) => !isPast(a) && a.status === 'booked') : all.filter((a) => isPast(a) || a.status !== 'booked').reverse()

  // Group by day for a readable schedule
  const days = []
  for (const a of list) {
    const day = formatDay(a.start, i18n.language)
    if (!days.length || days.at(-1).day !== day) days.push({ day, items: [] })
    days.at(-1).items.push(a)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('appointments.title')}</h1>
      <div className={styles.filters} role="tablist">
        {['upcoming', 'past'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx(styles.filter, tab === id && styles.filterOn)} onClick={() => setTab(id)}>
            {t(`appointments.${id}`)}
          </button>
        ))}
      </div>
      {days.length === 0 ? (
        <p className={styles.empty}>{t('appointments.empty')}</p>
      ) : (
        days.map(({ day, items }) => (
          <section key={day} className={styles.daySection} aria-label={day}>
            <h2 className={styles.dayTitle}>{day}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('appointments.cols.time')}</th>
                    <th scope="col">{t('appointments.cols.professional')}</th>
                    <th scope="col">{t('appointments.cols.type')}</th>
                    <th scope="col">{t('appointments.cols.topic')}</th>
                    <th scope="col">{t('appointments.cols.status')}</th>
                    <th scope="col">{t('appointments.cols.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => {
                    const p = PROFESSIONALS_BY_ID[a.professionalId]
                    return (
                      <tr key={a.id}>
                        <th scope="row">
                          {formatTime(a.start, i18n.language)}
                          <span className={styles.small}>{a.id}</span>
                        </th>
                        <td>
                          {p?.name}
                          <span className={styles.small}>{p?.title}</span>
                        </td>
                        <td>{tc(`typesLong.${a.type}`)}</td>
                        <td>
                          {tc(`book.topics.${a.topic}`)}
                          {a.shareResults && <span className={styles.small}>{t('appointments.shared')}</span>}
                        </td>
                        <td>
                          <Tag tone={TONE[a.status]}>{t(`appointments.status.${a.status}`)}</Tag>
                        </td>
                        <td className={styles.actionsCell}>
                          {a.status === 'booked' && (
                            <>
                              <button type="button" className={styles.miniButton} onClick={() => (setAppointmentStatus(storage, staff, a.userId, a.id, 'completed'), refresh())}>
                                {t('appointments.complete')}
                              </button>
                              <button type="button" className={styles.miniButton} onClick={() => (setAppointmentStatus(storage, staff, a.userId, a.id, 'no_show'), refresh())}>
                                {t('appointments.noShow')}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}

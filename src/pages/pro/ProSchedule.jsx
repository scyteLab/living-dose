import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, FileCheck2, FilePen, Share2 } from 'lucide-react'
import clsx from 'clsx'
import styles from '@/components/staff/Staff.module.css'
import Tag from '@/components/ui/Tag'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatDay, formatTime } from '@/lib/care/format'
import { lagosDay } from '@/lib/care/availability'
import { appointmentsFor } from '@/lib/pro/api'

/** "Dr Chinedu Okeke" → "Dr Okeke"; "Funmi Adeyemi" → "Funmi". */
const greetingName = (name) => (name.startsWith('Dr ') ? `Dr ${name.split(' ').at(-1)}` : name.split(' ')[0])

export default function ProSchedule() {
  const pro = useOutletContext()
  const { t, i18n } = useTranslation('pro')
  const tc = useTranslation('care').t
  useDocumentTitle(t('nav.schedule'))
  const [tab, setTab] = useState('upcoming')
  const [now] = useState(() => Date.now())
  const [all] = useState(() => appointmentsFor(window.localStorage, pro.id).filter((a) => a.status !== 'cancelled'))

  const today = lagosDay(new Date(now)).iso
  const ended = (a) => new Date(a.start).getTime() + a.minutes * 60000 < now
  const isToday = (a) => lagosDay(new Date(a.start)).iso === today
  const upcoming = all.filter((a) => !ended(a))
  const past = all.filter(ended).reverse()
  const dueSummaries = all.filter((a) => ended(a) && !a.summary && a.status !== 'no_show').length
  const week = upcoming.filter((a) => new Date(a.start).getTime() - now < 7 * 864e5).length
  const list = tab === 'past' ? past : upcoming

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('schedule.title', { name: greetingName(pro.name) })}</h1>
      <ul className={styles.stats}>
        <li className={styles.stat}>
          <p className={styles.statValue}>{upcoming.filter(isToday).length}</p>
          <p className={styles.statLabel}>{t('schedule.stats.today')}</p>
        </li>
        <li className={styles.stat}>
          <p className={styles.statValue}>{week}</p>
          <p className={styles.statLabel}>{t('schedule.stats.week')}</p>
        </li>
        <li className={styles.stat}>
          <p className={styles.statValue}>{dueSummaries}</p>
          <p className={styles.statLabel}>{t('schedule.stats.due')}</p>
        </li>
      </ul>
      <div className={styles.filters} role="tablist">
        {['upcoming', 'past'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx(styles.filter, tab === id && styles.filterOn)} onClick={() => setTab(id)}>
            {t(`schedule.${id}`)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className={styles.empty}>{t('schedule.empty')}</p>
      ) : (
        <ul className={styles.apptList}>
          {list.map((a) => (
            <li key={a.id}>
              <Link to={`/pro/consultations/${a.id}`} className={styles.apptRow}>
                <span className={styles.apptTime}>
                  <strong>{formatTime(a.start, i18n.language)}</strong>
                  <span className={styles.small}>{isToday(a) ? t('schedule.today') : formatDay(a.start, i18n.language)}</span>
                </span>
                <span className={styles.apptMain}>
                  <strong>{a.memberName || t('schedule.member')}</strong>
                  <span className={styles.small}>
                    {tc(`typesLong.${a.type}`)} · {tc(`book.topics.${a.topic}`)}
                  </span>
                </span>
                <span className={styles.apptTags}>
                  {a.shareResults && (
                    <Tag tone="sky">
                      <Share2 size={12} strokeWidth={2.4} aria-hidden="true" /> {t('schedule.results')}
                    </Tag>
                  )}
                  {ended(a) && a.status !== 'no_show' && (a.summary ? <Tag tone="leaf"><FileCheck2 size={12} strokeWidth={2.4} aria-hidden="true" /> {t('schedule.summaryDone')}</Tag> : <Tag tone="ember"><FilePen size={12} strokeWidth={2.4} aria-hidden="true" /> {t('schedule.summaryDue')}</Tag>)}
                </span>
                <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

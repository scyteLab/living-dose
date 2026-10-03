import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { proLoadSchedule, proSaveSchedule } from '@/lib/pro/service'
import { validHours } from '@/lib/pro/schedule'
import { toIso } from '@/lib/mealPlan/storage'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM

/** Loads the saved hours (from the server when connected), then shows the editor. */
export default function ProAvailability() {
  const pro = useOutletContext()
  const { t } = useTranslation('pro')
  useDocumentTitle(t('availability.title'))
  const [initial, setInitial] = useState(null)
  useEffect(() => {
    let alive = true
    proLoadSchedule(pro)
      .then((s) => alive && setInitial(s))
      .catch(() => alive && setInitial({ hours: pro.schedule, daysOff: [] }))
    return () => {
      alive = false
    }
  }, [pro])
  if (!initial) return <div className={styles.loading} role="status" aria-label={t('availability.title')} />
  return <AvailabilityEditor pro={pro} initial={initial} />
}

function AvailabilityEditor({ pro, initial }) {
  const { t, i18n } = useTranslation('pro')
  const [hours, setHours] = useState(initial.hours)
  const [daysOff, setDaysOff] = useState(initial.daysOff)
  const [newDay, setNewDay] = useState('')
  const [saved, setSaved] = useState(false)
  const dayNames = t('availability.days', { returnObjects: true })
  const hourLabel = (h) => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric' }).format(new Date(2026, 0, 1, h))
  const allValid = Object.values(hours).every(validHours)
  const today = toIso(new Date())

  const set = (d, range) => {
    setHours((h) => {
      const next = { ...h }
      if (range) next[d] = range
      else delete next[d]
      return next
    })
    setSaved(false)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('availability.title')}</h1>
      <p className={styles.muted}>{t('availability.intro')}</p>

      <section className={styles.panel} aria-labelledby="weekly-h">
        <h2 id="weekly-h" className={styles.dayTitle}>
          {t('availability.weekly')}
        </h2>
        <p className={styles.small}>{t('availability.timesIn')}</p>
        <ul className={styles.week}>
          {dayNames.map((name, d) => {
            const range = hours[d]
            const bad = range && !validHours(range)
            return (
              <li key={name} className={styles.weekRow}>
                <label className={styles.weekDay}>
                  <input type="checkbox" checked={Boolean(range)} onChange={(e) => set(d, e.target.checked ? [9, 17] : null)} />
                  <strong>{name}</strong>
                </label>
                {range ? (
                  <span className={styles.weekHours}>
                    <label>
                      <span className="sr-only">
                        {name} {t('availability.from')}
                      </span>
                      <select value={range[0]} onChange={(e) => set(d, [Number(e.target.value), range[1]])} aria-invalid={bad || undefined}>
                        {HOURS.slice(0, -1).map((h) => (
                          <option key={h} value={h}>
                            {hourLabel(h)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span aria-hidden="true">–</span>
                    <label>
                      <span className="sr-only">
                        {name} {t('availability.to')}
                      </span>
                      <select value={range[1]} onChange={(e) => set(d, [range[0], Number(e.target.value)])} aria-invalid={bad || undefined}>
                        {HOURS.slice(1).map((h) => (
                          <option key={h} value={h}>
                            {hourLabel(h)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </span>
                ) : (
                  <span className={styles.small}>{t('availability.off')}</span>
                )}
                {bad && <span className={styles.errorText}>{t('availability.hoursError')}</span>}
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="off-h">
        <h2 id="off-h" className={styles.dayTitle}>
          {t('availability.daysOff')}
        </h2>
        <p className={styles.small}>{t('availability.daysOffHint')}</p>
        <div className={styles.rowActions}>
          <label className="sr-only" htmlFor="day-off">
            {t('availability.addDayOff')}
          </label>
          <input id="day-off" type="date" min={today} value={newDay} onChange={(e) => setNewDay(e.target.value)} className={styles.dateInput} />
          <Button
            size="sm"
            variant="outline"
            disabled={!newDay}
            onClick={() => {
              setDaysOff((d) => [...new Set([...d, newDay])].sort())
              setNewDay('')
              setSaved(false)
            }}
          >
            {t('availability.addDayOff')}
          </Button>
        </div>
        {daysOff.length > 0 && (
          <ul className={styles.offList}>
            {daysOff.map((d) => {
              const [y, m, dd] = d.split('-').map(Number)
              return (
                <li key={d}>
                  {new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, dd))}
                  <button type="button" className={styles.iconButton} aria-label={`${t('availability.remove')} ${d}`} onClick={() => (setDaysOff(daysOff.filter((x) => x !== d)), setSaved(false))}>
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className={styles.rowActions}>
        <Button disabled={!allValid} onClick={() => proSaveSchedule(pro.id, { hours, daysOff }).then(() => setSaved(true)).catch(() => setSaved(false))}>
          {t('availability.save')}
        </Button>
        {saved && (
          <span className={styles.ok} role="status">
            {t('availability.saved')}
          </span>
        )}
      </div>
    </div>
  )
}

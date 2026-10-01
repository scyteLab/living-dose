import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CircleAlert } from 'lucide-react'
import clsx from 'clsx'
import ProCard from '@/components/care/ProCard'
import styles from '@/components/care/Care.module.css'
import { CONSULT_TYPES, LANGUAGES, PROFESSIONALS, SPECIALTIES } from '@/data/professionals'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { bookedSlots, listAppointments } from '@/lib/care/appointments'
import { availableDays, lagosDay } from '@/lib/care/availability'
import { withSchedule } from '@/lib/pro/schedule'

export default function CarePage() {
  const { t } = useTranslation('care')
  useDocumentTitle(t('docTitle'), t('metaDescription'))
  const { user } = useAuth()
  const langId = useId()
  const sortId = useId()
  const [params, setParams] = useSearchParams()
  const [upcoming, setUpcoming] = useState(0)

  const specialty = SPECIALTIES.includes(params.get('s')) ? params.get('s') : 'all'
  const type = CONSULT_TYPES.includes(params.get('type')) ? params.get('type') : null
  const language = LANGUAGES.includes(params.get('lang')) ? params.get('lang') : ''
  const todayOnly = params.get('today') === '1'
  const sort = params.get('sort') === 'experience' ? 'experience' : 'soonest'

  useEffect(() => {
    if (!user) return
    let alive = true
    listAppointments(user.id).then((list) => {
      if (alive) setUpcoming(list.filter((a) => a.status === 'booked' && new Date(a.start) > new Date()).length)
    })
    return () => {
      alive = false
    }
  }, [user])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'all') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  // Next free time for everyone, worked out once per visit
  const nextFor = useMemo(() => {
    const booked = bookedSlots()
    return Object.fromEntries(PROFESSIONALS.map((p) => [p.id, availableDays(withSchedule(p), { booked })]))
  }, [])

  const todayIso = lagosDay(new Date()).iso
  const results = PROFESSIONALS.filter(
    (p) =>
      (specialty === 'all' || p.specialty === specialty) &&
      (!type || p.types.includes(type)) &&
      (!language || p.languages.includes(language)) &&
      (!todayOnly || nextFor[p.id][0]?.date === todayIso),
  ).sort((a, b) =>
    sort === 'experience'
      ? b.years - a.years
      : (nextFor[a.id][0]?.slots[0] ?? '9999').localeCompare(nextFor[b.id][0]?.slots[0] ?? '9999'),
  )

  const filtered = type || language || todayOnly

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.intro}>{t('intro')}</p>
        </div>
        {user && (
          <Link to="/care/appointments" className={styles.mine}>
            <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
            {t('myAppointments')}
            {upcoming > 0 && <span className={styles.mineCount}>{t('upcomingCount', { count: upcoming })}</span>}
          </Link>
        )}
      </header>

      <p className={styles.emergency} role="note">
        <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
        {t('emergency')}
      </p>

      <nav className={styles.tabs} aria-label={t('specialties.all')}>
        {['all', ...SPECIALTIES].map((s) => (
          <button key={s} type="button" aria-pressed={specialty === s} className={clsx(styles.tab, specialty === s && styles.tabOn)} onClick={() => update({ s })}>
            {t(`specialties.${s}`)}
          </button>
        ))}
      </nav>

      <div className={styles.filters}>
        <div className={styles.typeChips} role="group" aria-label={t('filters.type')}>
          {CONSULT_TYPES.map((ty) => (
            <button key={ty} type="button" aria-pressed={type === ty} className={clsx(styles.chip, type === ty && styles.chipOn)} onClick={() => update({ type: type === ty ? null : ty })}>
              {t(`types.${ty}`)}
            </button>
          ))}
          <button type="button" aria-pressed={todayOnly} className={clsx(styles.chip, todayOnly && styles.chipOn)} onClick={() => update({ today: todayOnly ? null : '1' })}>
            {t('filters.today')}
          </button>
        </div>
        <div className={styles.selects}>
          <label htmlFor={langId} className="sr-only">
            {t('filters.language')}
          </label>
          <select id={langId} value={language} onChange={(e) => update({ lang: e.target.value })}>
            <option value="">{t('filters.anyLanguage')}</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <label htmlFor={sortId} className="sr-only">
            {t('filters.sort')}
          </label>
          <select id={sortId} value={sort} onChange={(e) => update({ sort: e.target.value === 'soonest' ? null : e.target.value })}>
            <option value="soonest">{t('filters.soonest')}</option>
            <option value="experience">{t('filters.experience')}</option>
          </select>
        </div>
      </div>

      <p className={styles.count} aria-live="polite">
        {t('count', { count: results.length })}
        {filtered && (
          <button type="button" className={styles.linkButton} onClick={() => update({ type: null, lang: null, today: null })}>
            {t('filters.clear')}
          </button>
        )}
      </p>

      {results.length === 0 ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : (
        <ul className={styles.grid}>
          {results.map((p) => (
            <li key={p.id}>
              <ProCard professional={p} next={nextFor[p.id][0]?.slots[0]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

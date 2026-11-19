import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, ClipboardCheck, PhoneCall, PartyPopper } from 'lucide-react'
import clsx from 'clsx'
import { FEELING_EMOJI, SLEEP_EMOJI, ScoreChart, StreakPill, WeekDots } from '@/components/checkin/parts'
import styles from '@/components/checkin/Checkin.module.css'
import PushCard from '@/components/push/PushCard'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useCheckins from '@/hooks/useCheckins'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { FEELINGS, SLEEP, SYMPTOMS, fullCheckStatus, isUrgent, unwellStreak, weekDots } from '@/lib/checkin/checkins'
import { loadLatestResult, loadScoreHistory } from '@/lib/healthCheck/storage'
import { alertFamily } from '@/lib/push/push'

const WARN = new Set(['chestPain', 'breathless'])
const EMPTY = { feeling: null, sleep: null, symptoms: [], systolic: '', diastolic: '', sugar: '', note: '' }

const fromEntry = (c) =>
  c
    ? {
        feeling: c.feeling,
        sleep: c.sleep,
        symptoms: c.symptoms ?? [],
        systolic: c.bp?.systolic ?? '',
        diastolic: c.bp?.diastolic ?? '',
        sugar: c.sugar ?? '',
        note: c.note ?? '',
      }
    : EMPTY

/** /check-in: the one-minute daily health check-in, and what it adds up to. */
export default function CheckIn() {
  const { t, i18n } = useTranslation('checkin')
  useDocumentTitle(t('docTitle'))
  const { user } = useAuth()
  const { list, today, todays, streak, save } = useCheckins(user.id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => fromEntry(todays))
  const [status, setStatus] = useState('idle') // idle | saving | error | needFeeling | offline
  const [scores, setScores] = useState([])
  const [latestAt, setLatestAt] = useState(undefined)

  useEffect(() => {
    let alive = true
    loadScoreHistory(user.id)
      .then((s) => alive && setScores(s))
      .catch(() => {})
    loadLatestResult(user.id)
      .then((r) => alive && setLatestAt(r?.createdAt ?? null))
      .catch(() => alive && setLatestAt(null))
    return () => {
      alive = false
    }
  }, [user.id])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    if (status === 'needFeeling') setStatus('idle')
  }
  const toggleSymptom = (id) => set({ symptoms: form.symptoms.includes(id) ? form.symptoms.filter((s) => s !== id) : [...form.symptoms, id] })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.feeling) {
      setStatus('needFeeling')
      document.getElementById('q-feeling')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setStatus('saving')
    try {
      const { synced, entry } = await save(form)
      // A warning sign: the server double-checks it and alerts family helpers
      if (synced && isUrgent(entry)) alertFamily()
      setStatus(synced ? 'idle' : 'offline')
      setEditing(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setStatus('error')
    }
  }

  const showForm = !todays || editing

  if (showForm) {
    return (
      <form className={styles.page} onSubmit={submit} noValidate>
        <header className={styles.head}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.lead}>{t('lead')}</p>
        </header>

        <fieldset className={styles.q} id="q-feeling">
          <legend className={styles.qTitle}>1. {t('feelingQ')}</legend>
          <div className={styles.options}>
            {FEELINGS.map((f) => (
              <button
                key={f}
                type="button"
                className={clsx(styles.option, form.feeling === f && styles.optionOn)}
                aria-pressed={form.feeling === f}
                onClick={() => set({ feeling: f })}
              >
                <span className={styles.emoji} aria-hidden="true">
                  {FEELING_EMOJI[f]}
                </span>
                {t(`feelings.${f}`)}
              </button>
            ))}
          </div>
          {status === 'needFeeling' && (
            <p className={styles.error} role="alert">
              {t('needFeeling')}
            </p>
          )}
        </fieldset>

        <fieldset className={styles.q}>
          <legend className={styles.qTitle}>2. {t('sleepQ')}</legend>
          <div className={styles.options}>
            {SLEEP.map((s) => (
              <button
                key={s}
                type="button"
                className={clsx(styles.option, form.sleep === s && styles.optionOn)}
                aria-pressed={form.sleep === s}
                onClick={() => set({ sleep: form.sleep === s ? null : s })}
              >
                <span className={styles.emoji} aria-hidden="true">
                  {SLEEP_EMOJI[s]}
                </span>
                {t(`sleepOptions.${s}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.q}>
          <legend className={styles.qTitle}>3. {t('symptomsQ')}</legend>
          <p className={styles.qHint}>{t('symptomsHint')}</p>
          <div className={styles.chips}>
            <button
              type="button"
              className={clsx(styles.chip, form.symptoms.length === 0 && styles.chipOn)}
              aria-pressed={form.symptoms.length === 0}
              onClick={() => set({ symptoms: [] })}
            >
              {t('none')}
            </button>
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                className={clsx(styles.chip, WARN.has(s) && styles.chipWarn, form.symptoms.includes(s) && styles.chipOn)}
                aria-pressed={form.symptoms.includes(s)}
                onClick={() => toggleSymptom(s)}
              >
                {t(`symptoms.${s}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <details className={styles.measure} open={Boolean(form.systolic || form.sugar)}>
          <summary>4. {t('measureQ')}</summary>
          <p className={styles.small}>{t('measureHint')}</p>
          <div>
            <span className={styles.label}>{t('bp')}</span>
            <div className={styles.bpRow}>
              <label>
                <span className={styles.small}>{t('systolic')}</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={form.systolic}
                  onChange={(e) => set({ systolic: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  placeholder="120"
                />
              </label>
              <span className={styles.slash} aria-hidden="true">
                /
              </span>
              <label>
                <span className={styles.small}>{t('diastolic')}</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={form.diastolic}
                  onChange={(e) => set({ diastolic: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  placeholder="80"
                />
              </label>
            </div>
          </div>
          <label>
            <span className={styles.label}>{t('sugar')}</span>
            <input
              className={styles.input}
              inputMode="numeric"
              value={form.sugar}
              onChange={(e) => set({ sugar: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              placeholder={t('sugarPlaceholder')}
            />
          </label>
          <label>
            <span className={styles.label}>{t('note')}</span>
            <textarea
              className={styles.textarea}
              value={form.note}
              maxLength={300}
              onChange={(e) => set({ note: e.target.value })}
              placeholder={t('notePlaceholder')}
            />
          </label>
        </details>

        {status === 'error' && (
          <p className={styles.error} role="alert">
            {t('saveError')}
          </p>
        )}
        <Button type="submit" size="lg" className={styles.submit} disabled={status === 'saving'}>
          {status === 'saving' ? t('saving') : t('save')}
        </Button>
      </form>
    )
  }

  // ---------- Done for today ----------
  const urgent = isUrgent(todays)
  const urgentKeys = todays.flags.filter((f) => f.startsWith('urgent:')).map((f) => f.slice(7))
  const advice = todays.flags.filter((f) => !f.startsWith('urgent:'))
  if (unwellStreak(list, today)) advice.push('unwell3')
  const full = fullCheckStatus(latestAt)
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })
  const monthFmt = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
  const first = scores[0]
  const last = scores[scores.length - 1]
  const diff = last && first ? last.score - first.score : 0

  return (
    <div className={styles.page}>
      {urgent && (
        <section className={clsx(styles.panel, styles.urgent)} role="alert">
          <h2 className={styles.panelTitle}>
            <CircleAlert size={22} strokeWidth={2.2} aria-hidden="true" />
            {t('urgent.title')}
          </h2>
          <ul className={styles.urgentList}>
            {urgentKeys.map((k) => (
              <li key={k}>{t(`urgent.${k}`)}</li>
            ))}
          </ul>
          <p className={styles.muted}>{t('urgent.body')}</p>
          <div className={styles.row}>
            <a href="tel:112" className={styles.callBtn}>
              <PhoneCall size={18} strokeWidth={2.2} aria-hidden="true" />
              {t('urgent.call')}
            </a>
            <Button to="/care" variant="outline">
              {t('urgent.doctor')}
            </Button>
          </div>
        </section>
      )}

      <section className={styles.doneCard} aria-live="polite">
        <span className={styles.tick} aria-hidden="true">
          <PartyPopper size={36} strokeWidth={2} />
        </span>
        <h1 className={styles.doneTitle}>{t('done.title')}</h1>
        <StreakPill count={streak.count} />
        <p className={styles.muted}>{streak.count <= 1 ? t('done.streakStart') : t('done.streakKeep')}</p>
        {streak.best > streak.count && <p className={styles.small}>{t('done.best', { count: streak.best })}</p>}
        <WeekDots dots={weekDots(list, today)} />
        {status === 'offline' && <p className={styles.small}>{t('savedOffline')}</p>}
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => {
              setForm(fromEntry(todays))
              setEditing(true)
            }}
          >
            {t('done.edit')}
          </Button>
          <Button to="/">{t('done.home')}</Button>
        </div>
      </section>

      <PushCard userId={user.id} why="checkin" compact />

      {advice.length > 0 && (
        <section className={styles.panel}>
          <ul className={styles.adviceList}>
            {advice.map((k) => (
              <li key={k}>{t(`advice.${k}`)}</li>
            ))}
          </ul>
          <Button to="/care" variant="outline" size="sm" className={styles.submit}>
            {t('advice.book')}
          </Button>
        </section>
      )}

      {latestAt !== undefined && full.state !== 'ok' && (
        <section className={clsx(styles.panel, styles.due)}>
          <h2 className={styles.panelTitle}>
            <ClipboardCheck size={20} strokeWidth={2} aria-hidden="true" /> {t('fullCheck.title')}
          </h2>
          <p className={styles.muted}>{full.state === 'soon' ? t('fullCheck.soon', { count: full.dueIn }) : t(`fullCheck.${full.state}`)}</p>
          <Button to="/health-check" size="sm">
            {t('fullCheck.start')}
          </Button>
        </section>
      )}

      {scores.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('scores.title')}</h2>
          <ScoreChart points={scores} />
          <p className={styles.muted}>
            {scores.length === 1
              ? t('scores.one')
              : t(`scores.change_${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'}`, { count: Math.abs(diff), date: monthFmt.format(new Date(first.createdAt)) })}
          </p>
        </section>
      )}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>{t('recent')}</h2>
        <ul className={styles.recent}>
          {list.slice(0, 7).map((c) => (
            <li key={c.date}>
              <span className={styles.recentEmoji} aria-hidden="true">
                {FEELING_EMOJI[c.feeling]}
              </span>
              <span className={styles.recentDate}>
                {dateFmt.format(new Date(`${c.date}T12:00:00`))} · {t(`feelings.${c.feeling}`)}
              </span>
              <span className={styles.small}>
                {[
                  c.sleep && `${SLEEP_EMOJI[c.sleep]} ${t(`sleepOptions.${c.sleep}`)}`,
                  c.symptoms.length ? c.symptoms.map((s) => t(`symptoms.${s}`)).join(', ') : t('none'),
                  c.bp && `BP ${c.bp.systolic}/${c.bp.diastolic}`,
                  c.sugar && `${c.sugar} mg/dL`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Lock, Plus, ShieldAlert, Trash2, Video } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import Tag from '@/components/ui/Tag'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { formatDay, formatTime } from '@/lib/care/format'
import { proConsultation, proMark, proSaveNote, proSaveSummary } from '@/lib/pro/service'

const FOLLOW_UPS = ['none', '2weeks', '4weeks', '3months']
const BAND_TONE = { strong: 'leaf', good: 'sky', grow: 'ember', attention: 'berry' }

/** Loads the consultation (from the server when connected), then shows it. */
export default function ProConsultation() {
  const pro = useOutletContext()
  const { appointmentId } = useParams()
  const { t } = useTranslation('pro')
  const [loaded, setLoaded] = useState(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let alive = true
    proConsultation(pro.id, appointmentId)
      .then((d) => alive && setLoaded(d))
      .catch(() => alive && setLoaded({ appt: null, results: null, note: '' }))
    return () => {
      alive = false
    }
  }, [pro.id, appointmentId, version])
  if (!loaded) return <div className={styles.loading} role="status" aria-label={t('nav.schedule')} />
  return <ConsultationView key={`${appointmentId}-${version}`} pro={pro} data={loaded} reload={() => setVersion((v) => v + 1)} />
}

function ConsultationView({ pro, data, reload }) {
  const { t, i18n } = useTranslation('pro')
  const tc = useTranslation('care').t
  const th = useTranslation('healthCheck').t
  useDocumentTitle(t('nav.schedule'))
  const appt = data.appt
  const [summary, setSummary] = useState(appt?.summary?.summary ?? '')
  const [steps, setSteps] = useState(appt?.summary?.nextSteps?.length ? appt.summary.nextSteps : [''])
  const [followUp, setFollowUp] = useState(appt?.summary?.followUp ?? '4weeks')
  const [note, setNote] = useState(data.note)
  const [noteSaved, setNoteSaved] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!appt) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>{t('consult.notFound')}</p>
        <Link to="/pro" className={styles.backLink}>
          {t('consult.back')}
        </Link>
      </div>
    )
  }

  const results = data.results
  const m = results?.measures

  const send = async (e) => {
    e.preventDefault()
    if (summary.trim().length < 20) {
      setError(true)
      return
    }
    setError(false)
    try {
      await proSaveSummary(appt, { summary, nextSteps: steps, followUp: followUp === 'none' ? null : followUp })
      setFailed(false)
      setSent(true)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/pro" className={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        {t('consult.back')}
      </Link>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>{t('consult.with', { type: tc(`typesLong.${appt.type}`), name: appt.memberName || t('schedule.member') })}</h1>
          <p className={styles.muted}>
            {formatDay(appt.start, i18n.language)}, {formatTime(appt.start, i18n.language)} (WAT) · {appt.id}
          </p>
        </div>
        <Tag tone={appt.status === 'completed' ? 'leaf' : appt.status === 'no_show' ? 'ember' : 'sky'}>{t(`consult.statuses.${appt.status}`)}</Tag>
      </header>

      <div className={styles.consultGrid}>
        <div className={styles.consultMain}>
          <section className={styles.panel}>
            <dl className={styles.facts}>
              <div>
                <dt>{t('consult.topic')}</dt>
                <dd>{tc(`book.topics.${appt.topic}`)}</dd>
              </div>
              <div>
                <dt>{t('consult.note')}</dt>
                <dd>{appt.note || <span className={styles.small}>{t('consult.noNote')}</span>}</dd>
              </div>
            </dl>
            {appt.status === 'booked' && (
              <div className={styles.rowActions}>
                <Button variant="care" disabled>
                  <Video size={18} strokeWidth={2} aria-hidden="true" />
                  {t('consult.join')}
                </Button>
                <button type="button" className={styles.miniButton} onClick={() => proMark(appt, 'no_show').then(reload).catch(() => setFailed(true))}>
                  {t('consult.noShow')}
                </button>
              </div>
            )}
            {appt.status === 'booked' && <p className={styles.small}>{t('consult.joinNote')}</p>}
          </section>

          <form className={styles.panel} onSubmit={send} noValidate>
            <h2 className={styles.dayTitle}>{t('consult.summaryTitle')}</h2>
            <p className={styles.small}>{t('consult.summaryHint')}</p>
            <Field label={t('consult.summary')} error={error ? t('consult.summaryError') : null}>
              <textarea rows={5} value={summary} onChange={(e) => (setSummary(e.target.value), setSent(false))} placeholder={t('consult.summaryPlaceholder')} />
            </Field>
            <fieldset className={styles.steps}>
              <legend className={styles.label}>{t('consult.steps')}</legend>
              {steps.map((s, i) => (
                <div key={i} className={styles.stepRow}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <input
                    value={s}
                    aria-label={`${t('consult.steps')} ${i + 1}`}
                    placeholder={i === 0 ? t('consult.stepPlaceholder') : ''}
                    onChange={(e) => (setSteps(steps.map((x, j) => (j === i ? e.target.value : x))), setSent(false))}
                  />
                  {steps.length > 1 && (
                    <button type="button" className={styles.iconButton} aria-label={t('consult.removeStep', { n: i + 1 })} onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
              {steps.length < 6 && (
                <button type="button" className={styles.rowLink} onClick={() => setSteps([...steps, ''])}>
                  <Plus size={15} strokeWidth={2.4} aria-hidden="true" /> {t('consult.addStep')}
                </button>
              )}
            </fieldset>
            <Field label={t('consult.followUp')}>
              <select value={followUp} onChange={(e) => setFollowUp(e.target.value)}>
                {FOLLOW_UPS.map((f) => (
                  <option key={f} value={f}>
                    {t(`consult.followUpOptions.${f}`)}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.rowActions}>
              <Button type="submit">{appt.summary ? t('consult.update') : t('consult.send')}</Button>
              {failed && (
                <span className={styles.errorText} role="alert">
                  {t('consult.failed')}
                </span>
              )}
              {sent && (
                <span className={styles.ok} role="status">
                  {t('consult.sent')}
                </span>
              )}
            </div>
          </form>

          <section className={styles.panel}>
            <h2 className={styles.dayTitle}>
              <Lock size={18} strokeWidth={2} aria-hidden="true" /> {t('consult.privateTitle')}
            </h2>
            <p className={styles.small}>{t('consult.privateHint')}</p>
            <label className="sr-only" htmlFor="private-note">
              {t('consult.privateTitle')}
            </label>
            <textarea
              id="private-note"
              className={styles.textarea}
              rows={4}
              value={note}
              onChange={(e) => (setNote(e.target.value), setNoteSaved(false))}
              onBlur={() => proSaveNote(pro.id, appt.id, note).then(() => setNoteSaved(true)).catch(() => setFailed(true))}
            />
            {noteSaved && (
              <span className={styles.ok} role="status">
                {t('consult.privateSaved')}
              </span>
            )}
          </section>
        </div>

        <aside className={styles.consultSide}>
          <section className={styles.panel}>
            <h2 className={styles.dayTitle}>{t('consult.results')}</h2>
            {results ? (
              <>
                <p className={styles.small}>{t('consult.checkedOn', { date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(results.createdAt)) })}</p>
                <div className={styles.scoreLine}>
                  <span className={styles.statValue}>{results.score}</span>
                  <span>
                    <span className={styles.small}>{t('consult.score')}</span>
                    <Tag tone={BAND_TONE[results.band]}>{th(`results.bands.${results.band}`)}</Tag>
                  </span>
                </div>
                <dl className={styles.facts}>
                  <div>
                    <dt>{t('consult.bmi')}</dt>
                    <dd>{m?.bmi ? `${m.bmi} (${th(`categories.bmi.${m.bmiCategory}`)})` : t('consult.notMeasured')}</dd>
                  </div>
                  <div>
                    <dt>{t('consult.bp')}</dt>
                    <dd>{m?.bpCategory ? `${m.systolic}/${m.diastolic} (${th(`categories.bp.${m.bpCategory}`)})` : t('consult.notMeasured')}</dd>
                  </div>
                  <div>
                    <dt>{t('consult.risk')}</dt>
                    <dd>{m?.findrisc?.applicable ? `${m.findrisc.points}/26 (${th(`categories.findrisc.${m.findrisc.band}`)})` : t('consult.notMeasured')}</dd>
                  </div>
                </dl>
                {results.priorities?.length > 0 && (
                  <>
                    <p className={styles.label}>{t('consult.priorities')}</p>
                    <ol className={styles.history}>
                      {results.priorities.map((p) => (
                        <li key={p.id}>{th(`results.priorities.${p.id}.title`, p.params)}</li>
                      ))}
                    </ol>
                  </>
                )}
              </>
            ) : (
              <p className={styles.muted}>{t('consult.resultsNotShared')}</p>
            )}
          </section>
          <p className={styles.guide}>
            <ShieldAlert size={18} strokeWidth={2} aria-hidden="true" />
            {t('consult.safety')}
          </p>
        </aside>
      </div>
    </div>
  )
}

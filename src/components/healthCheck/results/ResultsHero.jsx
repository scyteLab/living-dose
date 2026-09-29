import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, CalendarDays } from 'lucide-react'
import clsx from 'clsx'
import ScoreRing from '@/components/ui/ScoreRing'
import { BAND_COLOUR, PILLAR_COLOUR } from '@/lib/healthCheck/display'
import { scoreBand } from '@/lib/healthCheck/scoring'
import styles from './Results.module.css'

const PILLARS = ['eating', 'activity', 'body', 'sleep', 'mind', 'habits']
const BAND_ORDER = ['attention', 'grow', 'good', 'strong']

/** Score, headline, and the six areas as tabs that explain themselves. */
export default function ResultsHero({ results, answers, firstName, dateText, nextDateText }) {
  const { t, i18n } = useTranslation('healthCheck')
  const { pillars, score, band } = results

  const scored = PILLARS.filter((p) => pillars[p] != null)
  const lowest = [...scored].sort((a, b) => pillars[a] - pillars[b])[0]
  const [selected, setSelected] = useState(lowest)

  const list = new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' })
  const names = (ids) => list.format(ids.map((id) => t(`pillars.${id}`)))
  const strong = scored.filter((p) => pillars[p] >= 70).sort((a, b) => pillars[b] - pillars[a])
  const weak = scored.filter((p) => pillars[p] < 60).sort((a, b) => pillars[a] - pillars[b])
  let summary
  if (weak.length === 0) summary = t('results.summaryAllStrong')
  else if (strong.length === 0) summary = t('results.summaryAllWeak', { weak: names(weak) })
  else
    summary = t('results.summaryMixed', {
      strong: names(strong),
      strongVerb: strong.length > 1 ? t('results.are') : t('results.is'),
      weak: names(weak),
      weakVerb: weak.length > 1 ? t('results.are') : t('results.is'),
    })

  const headline = firstName ? t(`results.headline.${band}`, { name: firstName }) : t(`results.headlineNoName.${band}`)

  // Tabs: arrow keys move between areas (WAI-ARIA tabs pattern)
  const onKeyDown = (e) => {
    const i = PILLARS.indexOf(selected)
    const next = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!next) return
    e.preventDefault()
    const id = PILLARS[(i + next + PILLARS.length) % PILLARS.length]
    setSelected(id)
    document.getElementById(`pillar-tab-${id}`)?.focus()
  }

  return (
    <section className={styles.hero} aria-labelledby="score-title">
      <div className={styles.heroMain}>
        <p className={styles.heroDate}>{t('results.dateLine', { date: dateText })}</p>
        <div className={styles.scoreRow}>
          <ScoreRing value={score} size={188} stroke={16} className={styles.bigRing} />
          <div className={styles.scoreText}>
            <h1 id="score-title" className={styles.scoreTitle}>
              {t('results.scoreTitle')}
            </h1>
            <span className={styles.bandPill} style={{ background: BAND_COLOUR[band] }}>
              {t(`results.bands.${band}`)}
            </span>
            <div className={styles.bandLegend} role="img" aria-label={t('results.bandsLegend')}>
              {BAND_ORDER.map((b) => (
                <span key={b} className={clsx(b === band && styles.bandCurrent)} style={{ background: BAND_COLOUR[b] }} />
              ))}
            </div>
          </div>
        </div>
        <p className={styles.headline}>{headline}</p>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.heroChips}>
          <span>
            <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
            {t('results.nextCheck', { date: nextDateText })}
          </span>
          <span>
            <BadgeCheck size={15} strokeWidth={2} aria-hidden="true" />
            {t('results.measured')}
          </span>
        </div>
      </div>

      <div className={styles.areas}>
        <h2 className={styles.areasTitle}>
          {t('results.areasTitle')} <span>{t('results.areasHint')}</span>
        </h2>
        <div role="tablist" aria-label={t('results.areasLabel')} aria-orientation="vertical" className={styles.tabs} onKeyDown={onKeyDown}>
          {PILLARS.map((id) => {
            const value = pillars[id]
            const status = value == null ? 'skipped' : scoreBand(value)
            const on = id === selected
            return (
              <button
                key={id}
                id={`pillar-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="pillar-panel"
                tabIndex={on ? 0 : -1}
                className={clsx(styles.tab, on && styles.tabOn)}
                onClick={() => setSelected(id)}
              >
                <span className={styles.tabName}>{t(`pillars.${id}`)}</span>
                <span className={styles.tabTrack}>
                  <span style={{ width: `${value ?? 0}%`, background: PILLAR_COLOUR[id] }} />
                </span>
                <span className={styles.tabScore}>{value ?? '–'}</span>
                <span className={styles.tabStatus} style={{ background: value == null ? '#5b6655' : BAND_COLOUR[status] }}>
                  {t(`results.status.${status}`)}
                </span>
              </button>
            )
          })}
        </div>
        <div id="pillar-panel" role="tabpanel" aria-labelledby={`pillar-tab-${selected}`} className={styles.panel}>
          <p className={styles.panelTitle} style={{ color: PILLAR_COLOUR[selected] }}>
            {t(`pillars.${selected}`)}: {pillars[selected] != null ? t('results.ofHundred', { score: pillars[selected] }) : t('results.notScored')}
          </p>
          <p className={styles.panelText}>{pillarDetail(selected, results, answers, t)}</p>
        </div>
      </div>
    </section>
  )
}

/** The explanation shown for each area, built from the person's own answers. */
function pillarDetail(id, results, answers, t) {
  const m = results.measures
  const opt = (path, i) => (i == null ? '' : t(path, { returnObjects: true })[i]?.toLowerCase() ?? '')
  const bpPart = m.bpCategory ? `${m.systolic}/${m.diastolic} (${t(`categories.bp.${m.bpCategory}`).toLowerCase()})` : t('results.detail.bpNotKnown')

  switch (id) {
    case 'eating':
      return t('results.detail.eating', {
        fv: opt('eating.questions.fv.options', answers.eating.fv),
        drinks: opt('eating.questions.drinks.options', answers.eating.drinks),
        cubes: opt('eating.questions.cubes.options', answers.eating.cubes),
        fried: opt('eating.questions.fried.options', answers.eating.fried),
        grains: opt('eating.questions.grains.options', answers.eating.grains),
      })
    case 'activity':
      return t('results.detail.activity', {
        minutes: answers.activity.minutes,
        strength: opt('activity.strengthOptions', answers.activity.strengthDays),
      })
    case 'body':
      if (m.pregnant) return t('results.detail.bodyPregnant', { bpPart })
      return t('results.detail.body', {
        bmi: m.bmi,
        bmiCat: t(`categories.bmi.${m.bmiCategory}`).toLowerCase(),
        waistPart: m.whtr
          ? t('results.detail.waistPart', { whtr: m.whtr.toFixed(2), whtrCat: t(`categories.whtr.${m.whtrCategory}`).toLowerCase() })
          : t('results.detail.noWaist'),
        bpPart,
      })
    case 'sleep':
      return t('results.detail.sleep', { hours: answers.activity.sleepHours })
    case 'mind':
      if (answers.mind.skipped) return t('results.detail.mindSkipped')
      return m.mindPositive ? t('results.detail.mindPositive') : t('results.detail.mindNegative')
    case 'habits':
      return t('results.detail.habits', {
        tobacco: opt('habits.questions.tobacco.options', answers.habits.tobacco),
        alcohol: opt('habits.questions.alcohol.options', answers.habits.alcohol),
      })
    default:
      return ''
  }
}

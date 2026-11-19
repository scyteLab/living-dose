import { useTranslation } from 'react-i18next'
import { Check, Flame } from 'lucide-react'
import clsx from 'clsx'
import styles from './Checkin.module.css'

export const FEELING_EMOJI = { great: '😄', good: '🙂', okay: '😐', unwell: '🤒', bad: '😣' }
export const SLEEP_EMOJI = { good: '😴', okay: '🥱', poor: '😫' }

export function StreakPill({ count }) {
  const { t } = useTranslation('checkin')
  return (
    <span className={styles.streak}>
      <Flame size={22} strokeWidth={2.2} aria-hidden="true" />
      {t('done.streak', { count })}
    </span>
  )
}

/** Monday-to-Sunday dots. */
export function WeekDots({ dots }) {
  const { t, i18n } = useTranslation('checkin')
  const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' })
  const long = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' })
  return (
    <ol className={styles.week} aria-label={t('done.thisWeek')}>
      {dots.map((d) => {
        const date = new Date(`${d.date}T12:00:00`)
        return (
          <li key={d.date}>
            <span className={clsx(styles.dot, styles[`dot_${d.state}`])} aria-hidden="true">
              {d.state === 'done' && <Check size={18} strokeWidth={3} />}
            </span>
            <span aria-hidden="true">{fmt.format(date)}</span>
            <span className="sr-only">
              {long.format(date)}: {t(`days.${d.state}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** A small line chart of the Living Score, oldest to newest. */
export function ScoreChart({ points }) {
  const { i18n } = useTranslation()
  const W = 320
  const H = 140
  const pad = { l: 28, r: 16, t: 30, b: 24 }
  const fmt = new Intl.DateTimeFormat(i18n.language, { month: 'short' })
  const xs = points.map((_, i) => (points.length === 1 ? W / 2 : pad.l + (i * (W - pad.l - pad.r)) / (points.length - 1)))
  const y = (s) => pad.t + ((100 - s) * (H - pad.t - pad.b)) / 100
  const show = (i) => points.length <= 8 || i === 0 || i === points.length - 1
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)},${y(p.score).toFixed(1)}`).join(' ')
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.chart}
      role="img"
      aria-label={points.map((p) => `${fmt.format(new Date(p.createdAt))}: ${p.score}`).join(', ')}
    >
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className={styles.chartGrid} />
          <text x={pad.l - 6} y={y(g) + 4} textAnchor="end" className={styles.chartAxis}>
            {g}
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={d} className={styles.chartLine} />}
      {points.map((p, i) => (
        <g key={p.createdAt}>
          <circle cx={xs[i]} cy={y(p.score)} r="5" className={styles.chartDot} />
          {show(i) && (
            <>
              <text x={xs[i]} y={y(p.score) - 10} textAnchor="middle" className={styles.chartLabel}>
                {p.score}
              </text>
              <text x={xs[i]} y={H - 6} textAnchor="middle" className={styles.chartAxis}>
                {fmt.format(new Date(p.createdAt))}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

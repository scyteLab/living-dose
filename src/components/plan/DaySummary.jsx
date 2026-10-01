import { useTranslation } from 'react-i18next'
import { Droplets, Lightbulb } from 'lucide-react'
import clsx from 'clsx'
import styles from './Plan.module.css'

const TIPS = ['plate', 'water', 'cubes', 'batch', 'swallow', 'fruit', 'walk']

function Bar({ value, max, tone = 'leaf', over }) {
  return (
    <span className={styles.bar} aria-hidden="true">
      <span className={clsx(styles[`bar_${tone}`], over && styles.barOver)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </span>
  )
}

/** The chosen day at a glance: energy, protein, fibre, fruit and veg, salt, water, and a tip. */
export default function DaySummary({ dayName, totals, eatenKcal, targets, dayIndex }) {
  const { t } = useTranslation('plan')
  const tip = TIPS[dayIndex % TIPS.length]
  const vegDots = Array.from({ length: 5 }, (_, i) => i < Math.floor(totals.veg))

  return (
    <aside className={styles.summary} aria-label={t('summary.title', { day: dayName })}>
      <h2 className={styles.summaryTitle}>{t('summary.title', { day: dayName })}</h2>

      <div className={styles.energy}>
        <div className={styles.energyRow}>
          <span className={styles.energyValue}>{totals.kcal.toLocaleString()}</span>
          <span className={styles.energyTarget}>{t('summary.ofTarget', { target: targets.kcal.toLocaleString() })}</span>
        </div>
        <span className={styles.energyBar} aria-hidden="true">
          <span className={styles.energyPlanned} style={{ width: `${Math.min(100, (totals.kcal / targets.kcal) * 100)}%` }} />
          <span className={styles.energyEaten} style={{ width: `${Math.min(100, (eatenKcal / targets.kcal) * 100)}%` }} />
        </span>
        <p className={styles.energyNote}>{t('summary.eatenSoFar', { kcal: eatenKcal.toLocaleString() })}</p>
      </div>

      <dl className={styles.nutrients}>
        <div>
          <dt>{t('summary.protein')}</dt>
          <dd>{t('summary.gramsOf', { value: totals.protein, target: targets.protein })}</dd>
          <Bar value={totals.protein} max={targets.protein} tone="ember" />
        </div>
        <div>
          <dt>{t('summary.fibre')}</dt>
          <dd>{t('summary.gramsOf', { value: totals.fibre, target: targets.fibre })}</dd>
          <Bar value={totals.fibre} max={targets.fibre} tone="leaf" />
        </div>
        <div>
          <dt>{t('summary.veg')}</dt>
          <dd>{t('summary.portions', { count: totals.veg })}</dd>
          <span className={styles.vegDots} aria-hidden="true">
            {vegDots.map((on, i) => (
              <span key={i} className={clsx(on && styles.vegOn)} />
            ))}
          </span>
        </div>
        <div>
          <dt>{t('summary.salt')}</dt>
          <dd>
            {t('summary.saltValue', { value: totals.salt })} <small>({t('summary.saltLimit')})</small>
          </dd>
          <Bar value={totals.salt} max={targets.saltMax} tone="sky" over={totals.salt > targets.saltMax} />
        </div>
      </dl>

      <p className={styles.water}>
        <Droplets size={20} strokeWidth={2} aria-hidden="true" />
        <span>
          <strong>{t('summary.water')}</strong> {t('summary.waterValue', { value: targets.water })}
        </span>
      </p>

      <div className={styles.tip}>
        <p className={styles.tipTitle}>
          <Lightbulb size={18} strokeWidth={2} aria-hidden="true" />
          {t('tips.title')}
        </p>
        <p>{t(`tips.items.${tip}`)}</p>
      </div>

      <p className={styles.estimates}>{t('summary.estimates')}</p>
    </aside>
  )
}

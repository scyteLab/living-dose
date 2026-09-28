import { useTranslation } from 'react-i18next'
import { Check, ClipboardPlus, EyeOff, Flame, Leaf, Lock, ShieldCheck, Users, Video } from 'lucide-react'
import clsx from 'clsx'
import ScoreRing from '@/components/ui/ScoreRing'
import styles from './PanelVisuals.module.css'

/** Sign in: Living Score, today's lunch and a streak, floating. */
export function WelcomeBackVisual() {
  const { t } = useTranslation('auth')
  return (
    <div className={styles.stack} aria-hidden="true">
      <div className={clsx(styles.slot, styles.scoreSlot)} style={{ '--delay': '150ms' }}>
        <div className={clsx(styles.card, styles.scoreCard, 'motion-float')}>
          <ScoreRing value={78} size={68} stroke={9} className={styles.ring} />
          <div>
            <p className={styles.cardTitle}>{t('panel.scoreTitle')}</p>
            <p className={styles.cardNote}>{t('panel.scoreNote')}</p>
          </div>
        </div>
      </div>
      <div className={clsx(styles.slot, styles.mealSlot)} style={{ '--delay': '300ms' }}>
        <div className={clsx(styles.card, styles.mealCard, 'motion-float')} style={{ '--float-duration': '7s', '--float-delay': '-2s' }}>
          <span className={styles.mealIcon}>
            <Leaf size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.mealTime}>{t('panel.mealTime')}</p>
            <p className={styles.cardTitleSm}>{t('panel.mealName')}</p>
          </div>
        </div>
      </div>
      <div className={clsx(styles.slot, styles.streakSlot)} style={{ '--delay': '450ms' }}>
        <div className={clsx(styles.streak, 'motion-float')} style={{ '--float-duration': '5.5s', '--float-delay': '-4s' }}>
          <Flame size={17} strokeWidth={2} />
          {t('panel.streak')}
        </div>
      </div>
    </div>
  )
}

const BENEFITS = [
  { key: 'check', icon: ClipboardPlus, colour: '#f8a865' },
  { key: 'plans', icon: Leaf, colour: '#a9cf7f' },
  { key: 'experts', icon: Video, colour: '#7dc0f7' },
  { key: 'family', icon: Users, colour: '#c4b2e6' },
]

/** Sign up: what you get for free. */
export function BenefitsVisual() {
  const { t } = useTranslation('auth')
  return (
    <ul className={styles.list}>
      {BENEFITS.map(({ key, icon: Icon, colour }, i) => (
        <li key={key} className={styles.benefit} style={{ '--delay': `${150 + i * 110}ms` }}>
          <span className={styles.benefitIcon} style={{ color: colour }} aria-hidden="true">
            <Icon size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.benefitTitle}>{t(`panel.benefits.${key}.title`)}</p>
            <p className={styles.benefitBody}>{t(`panel.benefits.${key}.body`)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function FreeBadge() {
  const { t } = useTranslation('auth')
  return (
    <p className={styles.free}>
      <Check size={14} strokeWidth={2.5} aria-hidden="true" />
      {t('panel.free')}
    </p>
  )
}

const SECURITY = [
  { key: 'encrypted', icon: Lock, colour: '#a9cf7f' },
  { key: 'private', icon: EyeOff, colour: '#7dc0f7' },
  { key: 'neverAsk', icon: ShieldCheck, colour: '#f8a865' },
]

/** Verify: why the code matters. */
export function SecurityVisual() {
  const { t } = useTranslation('auth')
  return (
    <ul className={styles.list}>
      {SECURITY.map(({ key, icon: Icon, colour }, i) => (
        <li key={key} className={styles.security} style={{ '--delay': `${150 + i * 110}ms` }}>
          <Icon size={22} strokeWidth={1.8} style={{ color: colour, flexShrink: 0 }} aria-hidden="true" />
          <span>{t(`panel.security.${key}`)}</span>
        </li>
      ))}
    </ul>
  )
}

/** About you: a live summary of the choices being made on the right. */
export function PlanSummaryVisual({ whoLabel, goals }) {
  const { t } = useTranslation('auth')
  return (
    <div className={styles.summary} aria-live="polite">
      <div className={styles.summaryHead}>
        <p className={styles.cardTitle}>{t('panel.summaryTitle')}</p>
        <span className={styles.summaryBadge}>{t('panel.summaryBadge')}</span>
      </div>
      <div className={styles.summaryRow}>
        <p className={styles.summaryLabel}>{t('panel.summaryFor')}</p>
        <p className={styles.summaryValue}>{whoLabel ?? t('panel.summaryForEmpty')}</p>
      </div>
      <div className={styles.summaryRow}>
        <p className={styles.summaryLabel}>{t('panel.summaryGoals')}</p>
        {goals.length > 0 ? (
          <ul className={styles.summaryChips}>
            {goals.map((g) => (
              <li key={g.id} className={styles[`chip_${g.tone}`]}>
                {g.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.cardNote}>{t('panel.summaryGoalsEmpty')}</p>
        )}
      </div>
    </div>
  )
}

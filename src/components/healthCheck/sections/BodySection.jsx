import { useTranslation } from 'react-i18next'
import { Ruler } from 'lucide-react'
import Segmented from '@/components/auth/Segmented'
import Tag from '@/components/ui/Tag'
import useHealthCheck from '@/hooks/useHealthCheck'
import { bmiCategory, whtrCategory } from '@/lib/healthCheck/scoring'
import { BMI_TONE, WHTR_TONE, bmiPct, bmiSegments } from '@/lib/healthCheck/display'
import { asksPregnancy, toMetric, validBody } from '@/lib/healthCheck/sections'
import { GuidelineScale, LiveCard, NumberField } from '../Controls'
import styles from './Sections.module.css'

export default function BodySection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()
  const body = answers.body
  const metric = body.unit !== 'imperial'
  const { heightCm, weightKg } = toMetric(body)
  const showRangeError = heightCm && weightKg && !validBody(body)
  const set = (key) => (value) => update('body', { [key]: value })

  return (
    <>
      <Segmented
        label={t('body.units')}
        value={metric ? 'metric' : 'imperial'}
        onChange={(unit) => update('body', { unit, waist: '' })}
        options={[
          { value: 'metric', label: t('body.metric') },
          { value: 'imperial', label: t('body.imperial') },
        ]}
      />

      {metric ? (
        <div className={styles.row}>
          <NumberField label={t('body.height')} unit="cm" value={body.cm} onChange={set('cm')} placeholder="165" autoFocus />
          <NumberField label={t('body.weight')} unit="kg" value={body.kg} onChange={set('kg')} placeholder="72" />
        </div>
      ) : (
        <div className={styles.row}>
          <NumberField label={t('body.feet')} unit="ft" value={body.ft} onChange={set('ft')} placeholder="5" maxLength={1} inputMode="numeric" />
          <NumberField label={t('body.inches')} unit="in" value={body.inch} onChange={set('inch')} placeholder="5" maxLength={4} />
          <NumberField label={t('body.weight')} unit="lb" value={body.lb} onChange={set('lb')} placeholder="160" />
        </div>
      )}

      {showRangeError && (
        <p className={styles.warning} role="alert">
          {t('body.rangeError')}
        </p>
      )}

      <div className={styles.card}>
        <NumberField
          label={t('body.waist')}
          labelExtra={t('body.waistOptional')}
          unit={metric ? 'cm' : 'in'}
          value={body.waist}
          onChange={set('waist')}
        />
        <p className={styles.tip}>
          <Ruler size={16} strokeWidth={2} aria-hidden="true" />
          {t('body.waistHow')}
        </p>
      </div>

      {asksPregnancy(answers.about) && answers.about.pregnant === 1 && <p className={styles.note}>{t('body.pregnancyNote')}</p>}
    </>
  )
}

/** Live BMI and waist-to-height ratio beside the questions. */
export function BodyLive() {
  const { t } = useTranslation('healthCheck')
  const { answers } = useHealthCheck()
  const ok = validBody(answers.body)
  const { heightCm, weightKg, waistCm } = toMetric(answers.body)
  const bmi = ok ? weightKg / (heightCm / 100) ** 2 : null
  const cat = bmiCategory(bmi)
  const whtr = ok && waistCm ? waistCm / heightCm : null
  const wcat = whtrCategory(whtr)

  return (
    <LiveCard title={t('liveTitle')}>
      {ok ? (
        <>
          <div className={styles.liveRow}>
            <div>
              <p className={styles.liveLabel}>{t('body.bmi')}</p>
              <p className={styles.liveValue}>{bmi.toFixed(1)}</p>
            </div>
            <Tag tone={BMI_TONE[cat]}>{t(`categories.bmi.${cat}`)}</Tag>
          </div>
          <div className={styles.liveScale}>
            <GuidelineScale segments={bmiSegments(t)} markerPct={bmiPct(bmi)} />
          </div>
          {whtr && (
            <div className={`${styles.liveRow} ${styles.liveDivider}`}>
              <div>
                <p className={styles.liveLabel}>{t('body.whtr')}</p>
                <p className={styles.liveValueSm}>{whtr.toFixed(2)}</p>
              </div>
              <Tag tone={WHTR_TONE[wcat]}>{t(`categories.whtr.${wcat}`)}</Tag>
            </div>
          )}
        </>
      ) : (
        <p className={styles.liveEmpty}>{t('body.liveEmpty')}</p>
      )}
    </LiveCard>
  )
}

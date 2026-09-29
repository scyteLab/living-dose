import { useTranslation } from 'react-i18next'
import Tag from '@/components/ui/Tag'
import { GuidelineScale } from '@/components/healthCheck/Controls'
import {
  BMI_TONE,
  BP_TONE,
  FINDRISC_TONE,
  WHTR_TONE,
  bmiPct,
  bmiSegments,
  bpPct,
  bpSegments,
  findriscPct,
  findriscSegments,
  whtrPct,
  whtrSegments,
} from '@/lib/healthCheck/display'
import styles from './Results.module.css'

function NumberCard({ label, value, unit, tag, scale, note, source }) {
  return (
    <article className={styles.number}>
      <div className={styles.numberHead}>
        <h3 className={styles.numberLabel}>{label}</h3>
        {tag}
      </div>
      <p className={styles.numberValue}>
        {value}
        {unit && <small> {unit}</small>}
      </p>
      {scale}
      <p className={styles.numberNote}>{note}</p>
      <p className={styles.numberSource}>{source}</p>
    </article>
  )
}

/** BMI, waist-to-height, blood pressure and diabetes risk, each on its guideline scale. */
export default function KeyNumbers({ measures: m }) {
  const { t } = useTranslation('healthCheck')
  const f = m.findrisc
  const lossKg = m.weightKg ? Math.max(2, Math.round(m.weightKg * 0.05)) : null
  const na = t('results.notAvailable')

  return (
    <section className={styles.block} aria-labelledby="numbers-title">
      <div className={styles.blockHead}>
        <h2 id="numbers-title" className={styles.blockTitle}>
          {t('results.numbersTitle')}
        </h2>
        <p className={styles.blockIntro}>{t('results.numbersIntro')}</p>
      </div>
      <div className={styles.numbers}>
        <NumberCard
          label={t('results.numbers.bmi.label')}
          value={m.bmi ?? na}
          tag={!m.pregnant && m.bmiCategory && <Tag tone={BMI_TONE[m.bmiCategory]}>{t(`categories.bmi.${m.bmiCategory}`)}</Tag>}
          scale={!m.pregnant && m.bmi && <GuidelineScale segments={bmiSegments(t)} markerPct={bmiPct(m.bmi)} />}
          note={m.pregnant ? t('results.numbers.bmi.pregnant') : t(`results.numbers.bmi.notes.${m.bmiCategory}`, { kg: lossKg })}
          source={t('results.numbers.bmi.source')}
        />
        <NumberCard
          label={t('results.numbers.whtr.label')}
          value={m.whtr ? m.whtr.toFixed(2) : na}
          tag={m.whtrCategory && <Tag tone={WHTR_TONE[m.whtrCategory]}>{t(`categories.whtr.${m.whtrCategory}`)}</Tag>}
          scale={m.whtr && <GuidelineScale segments={whtrSegments(t)} markerPct={whtrPct(m.whtr)} />}
          note={
            m.whtr
              ? t(`results.numbers.whtr.notes.${m.whtrCategory}`, { waist: Math.round(m.waistCm), target: m.healthyWaistCm })
              : t('results.numbers.whtr.missing')
          }
          source={t('results.numbers.whtr.source')}
        />
        <NumberCard
          label={t('results.numbers.bp.label')}
          value={m.bpCategory ? `${m.systolic}/${m.diastolic}` : na}
          unit={m.bpCategory ? 'mmHg' : null}
          tag={m.bpCategory && <Tag tone={BP_TONE[m.bpCategory]}>{t(`categories.bp.${m.bpCategory}`)}</Tag>}
          scale={m.bpCategory && <GuidelineScale segments={bpSegments(t)} markerPct={bpPct(m.systolic, m.diastolic)} />}
          note={m.bpCategory ? t(`results.numbers.bp.notes.${m.bpCategory}`) : t('results.numbers.bp.missing')}
          source={t('results.numbers.bp.source')}
        />
        <NumberCard
          label={t('results.numbers.findrisc.label')}
          value={f.applicable ? f.points : na}
          unit={f.applicable ? t('results.numbers.findrisc.of') : null}
          tag={f.applicable && <Tag tone={FINDRISC_TONE[f.band]}>{t(`categories.findrisc.${f.band}`)}</Tag>}
          scale={f.applicable && <GuidelineScale segments={findriscSegments(t)} markerPct={findriscPct(f.points)} />}
          note={
            f.applicable
              ? `${t(f.band === 'low' ? 'results.numbers.findrisc.noteLow' : 'results.numbers.findrisc.note', { risk: f.risk })}${
                  f.waistIncluded ? '' : ` ${t('results.numbers.findrisc.noWaist')}`
                }`
              : t('results.numbers.findrisc.notApplicable')
          }
          source={t('results.numbers.findrisc.source')}
        />
      </div>
    </section>
  )
}

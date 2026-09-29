import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import Tag from '@/components/ui/Tag'
import useHealthCheck from '@/hooks/useHealthCheck'
import { BP_TONE } from '@/lib/healthCheck/display'
import { bpCategory } from '@/lib/healthCheck/scoring'
import { CONDITIONS, validBp } from '@/lib/healthCheck/sections'
import { ChoiceGroup, LiveCard, MultiChoice, NumberField } from '../Controls'
import styles from './Sections.module.css'

const FINDRISC_QUESTIONS = ['highSugar', 'bpMeds', 'family']

export default function HistorySection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()
  const h = answers.history
  const conditions = h.conditions ?? []

  const toggle = (id) => {
    if (id === 'none') return update('history', { conditions: conditions.includes('none') ? [] : ['none'] })
    const rest = conditions.filter((c) => c !== 'none')
    update('history', { conditions: rest.includes(id) ? rest.filter((c) => c !== id) : [...rest, id] })
  }

  const sys = parseInt(h.systolic, 10)
  const dia = parseInt(h.diastolic, 10)
  const entered = !h.bpUnknown && h.systolic && h.diastolic
  const invalid = entered && !validBp(h)
  const crisis = entered && !invalid && bpCategory(sys, dia) === 'crisis'
  const digits = (key) => (v) => update('history', { [key]: v.replace(/\D/g, '').slice(0, 3) })

  return (
    <>
      <MultiChoice
        legend={t('history.conditions')}
        help={t('history.conditionsHint')}
        options={CONDITIONS.map((id) => ({ value: id, label: t(`history.conditionOptions.${id}`) }))}
        values={conditions}
        onToggle={toggle}
      />

      <fieldset className={`${styles.card} ${styles.fieldset}`}>
        <legend className={styles.cardLegend}>
          {t('history.bpTitle')} <span>{t('history.bpOptional')}</span>
        </legend>
        {!h.bpUnknown && (
          <div className={styles.bpRow}>
            <NumberField label={t('history.bpTop')} unit={t('history.bpUnit')} value={h.systolic} onChange={digits('systolic')} placeholder="120" inputMode="numeric" maxLength={3} />
            <span className={styles.slash} aria-hidden="true">
              /
            </span>
            <NumberField label={t('history.bpBottom')} unit={t('history.bpUnit')} value={h.diastolic} onChange={digits('diastolic')} placeholder="80" inputMode="numeric" maxLength={3} />
          </div>
        )}
        <label className={styles.checkLine}>
          <input
            type="checkbox"
            checked={Boolean(h.bpUnknown)}
            onChange={(e) => update('history', { bpUnknown: e.target.checked, systolic: '', diastolic: '' })}
          />
          {t('history.bpUnknown')}
        </label>
        {h.bpUnknown && <p className={styles.tipPlain}>{t('history.bpUnknownNote')}</p>}
        {invalid && (
          <p className={styles.warning} role="alert">
            {t('history.bpInvalid')}
          </p>
        )}
        {crisis && (
          <Link to="/health-check/safety" className={styles.danger}>
            <TriangleAlert size={20} strokeWidth={2} aria-hidden="true" />
            {t('history.bpDanger')}
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
      </fieldset>

      {FINDRISC_QUESTIONS.map((id) => (
        <ChoiceGroup
          key={id}
          legend={t(`history.questions.${id}.title`)}
          help={t(`history.questions.${id}.help`, { defaultValue: '' }) || undefined}
          value={h[id]}
          onChange={(v) => update('history', { [id]: v })}
          options={t(`history.questions.${id}.options`, { returnObjects: true }).map((label, value) => ({ value, label }))}
        />
      ))}
    </>
  )
}

export function HistoryLive() {
  const { t } = useTranslation('healthCheck')
  const { answers } = useHealthCheck()
  const h = answers.history
  const ok = !h.bpUnknown && h.systolic && h.diastolic && validBp(h)
  const cat = ok ? bpCategory(parseInt(h.systolic, 10), parseInt(h.diastolic, 10)) : null

  return (
    <LiveCard title={t('history.liveBp')}>
      {ok ? (
        <>
          <p className={styles.liveValue}>
            {h.systolic}/{h.diastolic}
            <small> mmHg</small>
          </p>
          <Tag tone={BP_TONE[cat]}>{t(`categories.bp.${cat}`)}</Tag>
        </>
      ) : (
        <p className={styles.liveEmpty}>{t('history.liveBpEmpty')}</p>
      )}
    </LiveCard>
  )
}

import { useTranslation } from 'react-i18next'
import useHealthCheck from '@/hooks/useHealthCheck'
import { asksPregnancy } from '@/lib/healthCheck/sections'
import { ChoiceGroup, NumberField } from '../Controls'
import styles from './Sections.module.css'

export default function AboutSection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()
  const about = answers.about
  const age = parseInt(about.age, 10)
  const ageError = about.age && (!(age >= 18) || age > 110) ? t('about.ageError') : null

  return (
    <>
      <div className={styles.narrow}>
        <NumberField
          label={t('about.age')}
          unit={t('about.ageUnit')}
          value={about.age}
          onChange={(v) => update('about', { age: v.replace(/\D/g, '').slice(0, 3) })}
          inputMode="numeric"
          maxLength={3}
          placeholder="34"
          hint={t('about.ageHint')}
          error={ageError}
          autoFocus
        />
      </div>
      <ChoiceGroup
        legend={t('about.sex')}
        help={t('about.sexHint')}
        value={about.sex}
        onChange={(sex) => update('about', { sex, pregnant: sex === 'male' ? undefined : about.pregnant })}
        options={['female', 'male'].map((v) => ({ value: v, label: t(`about.sexOptions.${v}`) }))}
      />
      {asksPregnancy(about) && (
        <ChoiceGroup
          legend={t('about.pregnant')}
          value={about.pregnant}
          onChange={(pregnant) => update('about', { pregnant })}
          options={t('about.pregnantOptions', { returnObjects: true }).map((label, value) => ({ value, label }))}
        />
      )}
    </>
  )
}

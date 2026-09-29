import { useTranslation } from 'react-i18next'
import useHealthCheck from '@/hooks/useHealthCheck'
import { EATING_QUESTIONS } from '@/lib/healthCheck/sections'
import { ChoiceGroup, LiveCard } from '../Controls'
import styles from './Sections.module.css'

export default function EatingSection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()

  return EATING_QUESTIONS.map((id) => (
    <ChoiceGroup
      key={id}
      legend={t(`eating.questions.${id}.title`)}
      help={t(`eating.questions.${id}.help`)}
      value={answers.eating[id]}
      onChange={(v) => update('eating', { [id]: v })}
      options={t(`eating.questions.${id}.options`, { returnObjects: true }).map((label, value) => ({ value, label }))}
    />
  ))
}

export function EatingLive() {
  const { t } = useTranslation('healthCheck')
  const { answers } = useHealthCheck()
  const done = EATING_QUESTIONS.filter((id) => answers.eating[id] != null).length
  return (
    <LiveCard>
      <div className={styles.counterLive}>
        <span className={styles.liveValue}>
          {done}
          <small>/{EATING_QUESTIONS.length}</small>
        </span>
        <span className={styles.liveEmpty}>{t('eating.answered')}</span>
      </div>
    </LiveCard>
  )
}

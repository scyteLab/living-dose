import { useTranslation } from 'react-i18next'
import useHealthCheck from '@/hooks/useHealthCheck'
import { ChoiceGroup } from '../Controls'

export default function HabitsSection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()

  return ['tobacco', 'alcohol'].map((id) => (
    <ChoiceGroup
      key={id}
      legend={t(`habits.questions.${id}.title`)}
      help={t(`habits.questions.${id}.help`)}
      value={answers.habits[id]}
      onChange={(v) => update('habits', { [id]: v })}
      options={t(`habits.questions.${id}.options`, { returnObjects: true }).map((label, value) => ({ value, label }))}
    />
  ))
}

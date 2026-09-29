import { useTranslation } from 'react-i18next'
import Tag from '@/components/ui/Tag'
import useHealthCheck from '@/hooks/useHealthCheck'
import { ChoiceGroup, Counter, RangeField } from '../Controls'

export default function ActivitySection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()
  const { minutes = 0, strengthDays, sleepHours = 7 } = answers.activity

  const gap = 150 - minutes
  const minutesBand = minutes >= 150 ? ['meets', 'leaf'] : minutes >= 75 ? ['getting', 'sky'] : ['grow', 'ember']
  const sleepBand = sleepHours < 7 ? ['short', 'ember'] : sleepHours <= 9 ? ['healthy', 'leaf'] : ['long', 'sky']
  const hours = sleepHours % 1 ? sleepHours.toFixed(1) : String(sleepHours)

  return (
    <>
      <RangeField
        label={t('activity.minutes')}
        help={t('activity.minutesHelp')}
        value={minutes}
        min={0}
        max={420}
        step={10}
        onChange={(v) => update('activity', { minutes: v })}
        display={`${minutes} ${t('activity.minutesUnit')}`}
        valueText={t('activity.minutesValue', { count: minutes })}
        markerPct={(150 / 420) * 100}
        markerLabel={t('activity.target')}
        minLabel="0"
        maxLabel={t('activity.max')}
        status={<Tag tone={minutesBand[1]}>{t(`activity.bands.${minutesBand[0]}`, { gap })}</Tag>}
      />
      <ChoiceGroup
        legend={t('activity.strength')}
        help={t('activity.strengthHelp')}
        value={strengthDays}
        onChange={(v) => update('activity', { strengthDays: v })}
        options={t('activity.strengthOptions', { returnObjects: true }).map((label, value) => ({ value, label }))}
      />
      <Counter
        label={t('activity.sleep')}
        value={hours}
        unit={t('activity.hoursUnit')}
        onDecrease={() => update('activity', { sleepHours: Math.max(3, sleepHours - 0.5) })}
        onIncrease={() => update('activity', { sleepHours: Math.min(12, sleepHours + 0.5) })}
        decreaseLabel={t('activity.less')}
        increaseLabel={t('activity.more')}
        status={<Tag tone={sleepBand[1]}>{t(`activity.sleepBands.${sleepBand[0]}`)}</Tag>}
      />
    </>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import useHealthCheck from '@/hooks/useHealthCheck'
import { MIND_QUESTIONS } from '@/lib/healthCheck/sections'
import { ChoiceGroup } from '../Controls'
import styles from './Sections.module.css'

/** PHQ-2 and GAD-2. The wording is the validated wording and must not be changed. */
export default function MindSection() {
  const { t } = useTranslation('healthCheck')
  const { answers, update } = useHealthCheck()
  const mind = answers.mind

  if (mind.skipped) {
    return (
      <div className={styles.skipped}>
        <p>{t('mind.skipped')}</p>
        <button type="button" className={styles.linkButton} onClick={() => update('mind', { skipped: false })}>
          {t('mind.undo')}
        </button>
      </div>
    )
  }

  return (
    <>
      <p className={styles.intro}>{t('mind.intro')}</p>
      {MIND_QUESTIONS.map((id) => (
        <ChoiceGroup
          key={id}
          legend={t(`mind.questions.${id}.title`)}
          value={mind[id]}
          onChange={(v) => update('mind', { [id]: v })}
          options={t(`mind.questions.${id}.options`, { returnObjects: true }).map((label, value) => ({ value, label }))}
        />
      ))}
      <button type="button" className={styles.linkButton} onClick={() => update('mind', { skipped: true })}>
        {t('mind.skip')}
      </button>
    </>
  )
}

export function MindSupport() {
  const { t } = useTranslation('healthCheck')
  return (
    <div className={styles.support}>
      <p className={styles.supportTitle}>
        <Heart size={20} strokeWidth={2} aria-hidden="true" />
        {t('mind.supportTitle')}
      </p>
      <p>{t('mind.supportBody')}</p>
      <p className={styles.supportCrisis}>{t('mind.supportCrisis')}</p>
      <Link to="/care" className={styles.supportLink}>
        {t('mind.supportCta')}
      </Link>
    </div>
  )
}

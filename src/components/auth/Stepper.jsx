import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import styles from './Stepper.module.css'

const STEPS = ['account', 'verify', 'about', 'done']

/** Sign-up progress: Account → Verify → About you → Done. `current` is 0-based. */
export default function Stepper({ current }) {
  const { t } = useTranslation('auth')

  return (
    <ol className={styles.steps} aria-label={t('steps.label')}>
      {STEPS.map((step, i) => (
        <li
          key={step}
          className={clsx(styles.step, i < current && styles.done, i === current && styles.current)}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className={styles.dot}>{i < current ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}</span>
          <span className={styles.name}>{t(`steps.${step}`)}</span>
          {i < current && <span className="sr-only">{t('steps.completed')}</span>}
        </li>
      ))}
    </ol>
  )
}

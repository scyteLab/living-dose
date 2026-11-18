import { useTranslation } from 'react-i18next'
import { Accessibility } from 'lucide-react'
import Button from '@/components/ui/Button'
import styles from './Simple.module.css'

/** A small card on the full dashboard offering Simple view. */
export default function SimplePrompt({ onSwitch }) {
  const { t } = useTranslation('simple')
  return (
    <aside className={styles.prompt}>
      <span className={styles.promptIcon} aria-hidden="true">
        <Accessibility size={26} strokeWidth={2} />
      </span>
      <div className={styles.promptText}>
        <h2 className={styles.promptTitle}>{t('prompt.title')}</h2>
        <p>{t('prompt.body')}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onSwitch}>
        {t('prompt.action')}
      </Button>
    </aside>
  )
}

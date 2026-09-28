import { useTranslation } from 'react-i18next'
import { FlaskConical } from 'lucide-react'
import { isDemo } from '@/lib/auth'
import styles from './DemoNotice.module.css'

/** Shown only while Supabase isn't connected, so nobody mistakes the demo for real sign-in. */
export default function DemoNotice() {
  const { t } = useTranslation('auth')
  if (!isDemo) return null
  return (
    <p className={styles.notice} role="note">
      <FlaskConical size={18} strokeWidth={2} aria-hidden="true" />
      <span>{t('demo')}</span>
    </p>
  )
}

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound, LogOut, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import { signOutEverywhere } from '@/lib/auth'
import { displayPhone } from '@/lib/phone'
import styles from './Account.module.css'

export default function SecuritySection({ user }) {
  const { t } = useTranslation('account')
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const phone = user.phone ? displayPhone(user.phone.startsWith('+') ? user.phone : `+${user.phone}`) : null

  return (
    <section className={styles.section} aria-labelledby="security-h">
      <h2 id="security-h" className={styles.sectionTitle}>
        {t('security.title')}
      </h2>
      <div className={styles.card}>
        <p className={styles.label}>
          <KeyRound size={18} strokeWidth={2} aria-hidden="true" />
          {t('security.method')}
        </p>
        <p>{phone ? t('security.methodPhone', { phone }) : t('security.methodEmail', { email: user.email })}</p>
        <p className={styles.small}>{t('security.noPassword')}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.label}>
          <LogOut size={18} strokeWidth={2} aria-hidden="true" />
          {t('security.signOut')}
        </p>
        <p className={styles.small}>{t('security.signOutBody')}</p>
        <Button
          variant="outline"
          size="sm"
          className={styles.selfStart}
          onClick={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
        >
          {t('security.signOut')}
        </Button>
      </div>
      <div className={styles.card}>
        <p className={styles.label}>
          <MonitorSmartphone size={18} strokeWidth={2} aria-hidden="true" />
          {t('security.signOutAll')}
        </p>
        <p className={styles.small}>{t('security.signOutAllBody')}</p>
        <Button
          variant="outline"
          size="sm"
          className={`${styles.selfStart} ${styles.danger}`}
          onClick={async () => {
            if (!window.confirm(t('security.signOutAllConfirm'))) return
            await signOutEverywhere()
            navigate('/', { replace: true })
          }}
        >
          {t('security.signOutAll')}
        </Button>
      </div>
      <div className={styles.tips}>
        <p className={styles.label}>
          <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
          {t('security.tips')}
        </p>
        <ul>
          {t('security.tipsItems', { returnObjects: true }).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

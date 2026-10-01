import { useTranslation } from 'react-i18next'
import { ArrowRight, Check } from 'lucide-react'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import styles from './Plan.module.css'

/** What people who aren't signed in see on /plan. */
export default function PlanGuest() {
  const { t } = useTranslation('plan')
  return (
    <div className={styles.guest}>
      <PageIntro eyebrow={t('guest.eyebrow')} title={t('guest.title')} intro={t('guest.body')} tone="ember">
        <ul className={styles.guestPoints}>
          {t('guest.points', { returnObjects: true }).map((p) => (
            <li key={p}>
              <Check size={18} strokeWidth={2.6} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
        <div className={styles.guestActions}>
          <Button to="/join" variant="action">
            {t('guest.cta')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button to="/sign-in" state={{ from: '/plan' }} variant="outline">
            {t('guest.signIn')}
          </Button>
        </div>
      </PageIntro>
    </div>
  )
}

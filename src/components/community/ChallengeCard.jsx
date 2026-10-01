import { useTranslation } from 'react-i18next'
import { Activity, CheckCircle2, Droplet, Utensils } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import styles from './Community.module.css'

const ICON = { 'water-week': Droplet, 'move-150': Activity, 'log-meals': Utensils }
const TONE = { 'water-week': 'sky', 'move-150': 'ember', 'log-meals': 'leaf' }

export default function ChallengeCard({ challenge, joined, progress, onToggle, signedIn }) {
  const { t } = useTranslation('community')
  const Icon = ICON[challenge.id]
  const tone = TONE[challenge.id]
  return (
    <article className={clsx(styles.challenge, styles[`challenge_${tone}`])}>
      <div className={styles.challengeHead}>
        <span className={styles.challengeIcon} aria-hidden="true">
          <Icon size={24} strokeWidth={1.8} />
        </span>
        <span className={styles.small}>{t('challenges.taking', { count: challenge.participants + (joined ? 1 : 0) })}</span>
      </div>
      <h3 className={styles.challengeTitle}>{t(`challenges.items.${challenge.id}.title`)}</h3>
      <p className={styles.muted}>{t(`challenges.items.${challenge.id}.body`)}</p>
      {joined && progress && (
        <div className={styles.challengeProgress}>
          <div className={styles.progressText}>
            <strong>{t(`challenges.items.${challenge.id}.progress`, { value: progress.value, target: progress.target })}</strong>
            {progress.done && (
              <span className={styles.completed}>
                <CheckCircle2 size={16} strokeWidth={2.2} aria-hidden="true" />
                {t('challenges.completed')}
              </span>
            )}
          </div>
          <span className={styles.bar} role="progressbar" aria-valuenow={progress.value} aria-valuemin={0} aria-valuemax={progress.target} aria-label={t(`challenges.items.${challenge.id}.title`)}>
            <span style={{ width: `${progress.pct}%` }} />
          </span>
        </div>
      )}
      <div className={styles.challengeFoot}>
        {!signedIn ? (
          <Button to="/sign-in" state={{ from: '/community?tab=challenges' }} variant="outline" size="sm">
            {t('challenges.signIn')}
          </Button>
        ) : joined ? (
          <>
            <span className={styles.inLabel}>{t('challenges.joinedLabel')}</span>
            <button type="button" className={styles.linkButton} onClick={() => onToggle(challenge.id)}>
              {t('challenges.leave')}
            </button>
          </>
        ) : (
          <Button size="sm" onClick={() => onToggle(challenge.id)}>
            {t('challenges.join')}
          </Button>
        )}
      </div>
    </article>
  )
}

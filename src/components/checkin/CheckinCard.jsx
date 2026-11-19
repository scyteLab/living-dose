import { useTranslation } from 'react-i18next'
import { Check, Flame } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import useCheckins from '@/hooks/useCheckins'
import styles from './Checkin.module.css'

/** Dashboard nudge: check in today, or celebrate that it's done. */
export default function CheckinCard({ userId }) {
  const { t } = useTranslation('checkin')
  const { streak } = useCheckins(userId)
  const done = streak.doneToday

  return (
    <section className={clsx(styles.card, done ? styles.cardDone : styles.cardTodo)} aria-label={t('docTitle')}>
      <span className={styles.cardIcon} aria-hidden="true">
        {done ? <Check size={28} strokeWidth={3} /> : '🙂'}
      </span>
      <div>
        <p className={styles.cardTitle}>
          {done ? t('card.done') : t('card.todo')}
          {streak.count > 0 && (
            <>
              {' · '}
              <span className={styles.flame}>
                <Flame size={16} strokeWidth={2.4} aria-hidden="true" />
                {t('done.streak', { count: streak.count })}
              </span>
            </>
          )}
        </p>
        <p className={styles.cardBody}>{done ? t('done.streakKeep') : streak.atRisk ? t('card.atRisk', { count: streak.count }) : t('card.todoBody')}</p>
      </div>
      <Button to="/check-in" size="sm" variant={done ? 'outline' : 'action'}>
        {done ? t('card.view') : t('card.start')}
      </Button>
    </section>
  )
}

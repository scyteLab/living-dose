import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, ClipboardPlus, Lock, ShoppingBasket, Utensils, Video } from 'lucide-react'
import clsx from 'clsx'
import { gettingStarted } from '@/lib/dashboard/insights'
import WaterTracker from './WaterTracker'
import styles from './Dashboard.module.css'

const ICONS = { check: ClipboardPlus, plan: Utensils, shop: ShoppingBasket, care: Video }

/** First-run Home: four steps, a score placeholder and a habit to start straight away. */
export default function GettingStarted({ firstName, status, water, setWater }) {
  const { t } = useTranslation('dashboard')
  const { steps, done, next } = gettingStarted(status)

  return (
    <div className={styles.start}>
      <div className={styles.startMain}>
        <div className={styles.startHead}>
          <p className={styles.eyebrow}>{t('start.eyebrow')}</p>
          <h1 className={styles.startTitle}>{firstName ? t('start.title', { name: firstName }) : t('start.titleNoName')}</h1>
          <p className={styles.lead}>{t('start.body')}</p>
        </div>
        <div className={styles.startProgress}>
          <div className={styles.startProgressText}>
            <span>{t('start.progress')}</span>
            <span className={styles.muted}>{t('start.progressCount', { done })}</span>
          </div>
          <div className={styles.bar} role="progressbar" aria-label={t('start.progress')} aria-valuenow={done} aria-valuemin={0} aria-valuemax={4}>
            <span className={styles.barLeaf} style={{ width: `${(done / 4) * 100}%` }} />
          </div>
        </div>
        <ol className={styles.steps}>
          {steps.map((s, i) => {
            const Icon = s.done ? Check : ICONS[s.id]
            const isNext = next?.id === s.id
            return (
              <li key={s.id} className={clsx(styles.step, isNext && styles.stepNext, s.done && styles.stepIsDone)}>
                <span className={styles.stepIcon} aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div className={styles.stepText}>
                  <span className={styles.stepNum}>{s.done ? t('start.done') : t('start.step', { n: i + 1 })}</span>
                  <span className={styles.stepTitle}>{t(`start.steps.${s.id}.title`)}</span>
                  <span className={styles.muted}>{t(`start.steps.${s.id}.body`)}</span>
                </div>
                {!s.done &&
                  (s.locked ? (
                    <span className={styles.stepLocked}>
                      <Lock size={15} strokeWidth={2} aria-hidden="true" />
                      {t('start.steps.plan.locked')}
                    </span>
                  ) : isNext ? (
                    <Link to={s.to} className={styles.stepCta}>
                      {t(`start.steps.${s.id}.cta`)}
                      <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link to={s.to} className={styles.stepLink}>
                      {t(`start.steps.${s.id}.cta`)}
                    </Link>
                  ))}
              </li>
            )
          })}
        </ol>
      </div>
      <aside className={styles.startSide}>
        <div className={styles.placeholderScore}>
          <p className={styles.scoreTitle}>{t('start.scoreTitle')}</p>
          <div className={styles.placeholderRow}>
            <span className={styles.placeholderRing} aria-hidden="true">
              ?
            </span>
            <p>{t('start.scoreBody')}</p>
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitle}>{t('start.habitTitle')}</p>
          <WaterTracker value={water} onChange={setWater} />
          <p className={styles.small}>{t('start.habitHint')}</p>
        </div>
        <p className={styles.privacy}>
          <Lock size={20} strokeWidth={2} aria-hidden="true" />
          {t('start.privacy')}
        </p>
      </aside>
    </div>
  )
}

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, Video } from 'lucide-react'
import clsx from 'clsx'
import ScoreRing from '@/components/ui/ScoreRing'
import Tag from '@/components/ui/Tag'
import PlateIllustration from '@/components/illustrations/PlateIllustration'
import useFitScale from '@/hooks/useFitScale'
import styles from './HeroVisual.module.css'

// The composition is designed at this size and scaled down as one piece to fit
const DESIGN_WIDTH = 580
const DESIGN_HEIGHT = 620

/**
 * A glimpse of the app: Living Score, today's lunch, a dietitian call and a streak.
 * Each card pops in (outer "slot"), then floats gently (inner "card").
 * On tablets and desktops the whole stage scales to fit its frame, so shorter
 * laptop screens get a smaller version rather than overlapping cards.
 * Read as one image by screen readers, described by its label.
 */
export default function HeroVisual() {
  const { t } = useTranslation()
  const frameRef = useRef(null)
  const scale = useFitScale(frameRef, { width: DESIGN_WIDTH, height: DESIGN_HEIGHT })

  return (
    <div ref={frameRef} className={styles.frame}>
      <div
        className={styles.stage}
        style={scale < 1 ? { transform: `scale(${scale})` } : undefined}
        role="img"
        aria-label={t('landing.hero.visualLabel')}
      >
        <div className={clsx(styles.blob, styles.blobLeaf, 'motion-breathe')} />
        <div className={clsx(styles.blob, styles.blobEmber, 'motion-breathe')} style={{ '--breathe-delay': '-5s' }} />
        <div className={clsx(styles.blob, styles.blobSky, 'motion-breathe')} style={{ '--breathe-delay': '-2s' }} />

        {/* Living Score */}
        <div className={clsx(styles.slot, styles.slotScore, 'motion-pop-in')} style={{ '--delay': '200ms' }}>
          <div className={clsx(styles.card, styles.scoreCard, 'motion-float')}>
            <ScoreRing value={78} size={84} stroke={9} delay={500} className={styles.ring} />
            <div className={styles.scoreText}>
              <span className={styles.scoreTitle}>{t('landing.hero.scoreTitle')}</span>
              <span className={styles.scoreNote}>{t('landing.hero.scoreNote')}</span>
            </div>
          </div>
        </div>

        {/* Today's lunch */}
        <div className={clsx(styles.slot, styles.slotMeal, 'motion-pop-in')} style={{ '--delay': '350ms' }}>
          <div
            className={clsx(styles.card, styles.mealCard, 'motion-float')}
            style={{ '--float-duration': '7s', '--float-delay': '-2s' }}
          >
            <div className={styles.plate}>
              <PlateIllustration size={118} />
            </div>
            <div className={styles.mealMeta}>
              <span className={styles.mealTime}>{t('landing.hero.mealTime')}</span>
              <span className={styles.mealKcal}>{t('landing.hero.mealKcal')}</span>
            </div>
            <span className={styles.mealName}>{t('landing.hero.mealName')}</span>
            <div className={styles.tags}>
              <Tag tone="leaf">{t('landing.hero.tagDiabetic')}</Tag>
              <Tag>{t('landing.hero.tagFibre')}</Tag>
            </div>
          </div>
        </div>

        {/* Dietitian call */}
        <div className={clsx(styles.slot, styles.slotConsult, 'motion-pop-in')} style={{ '--delay': '500ms' }}>
          <div
            className={clsx(styles.card, styles.consultCard, 'motion-float')}
            style={{ '--float-duration': '5.5s', '--float-delay': '-4s' }}
          >
            <span className={styles.consultIcon}>
              <Video size={22} strokeWidth={1.8} />
            </span>
            <span className={styles.consultText}>
              <span className={styles.consultTitle}>{t('landing.hero.consultTitle')}</span>
              <span className={styles.consultTime}>{t('landing.hero.consultTime')}</span>
            </span>
            <span className={styles.join}>{t('landing.hero.consultJoin')}</span>
          </div>
        </div>

        {/* Streak */}
        <div className={clsx(styles.slot, styles.slotStreak, 'motion-pop-in')} style={{ '--delay': '650ms' }}>
          <div className={clsx(styles.streak, 'motion-float')} style={{ '--float-duration': '6.5s', '--float-delay': '-1s' }}>
            <Flame size={18} strokeWidth={2} />
            {t('landing.hero.streak')}
          </div>
        </div>
      </div>
    </div>
  )
}

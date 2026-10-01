import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardPlus, Settings2, Sparkles } from 'lucide-react'
import Segmented from '@/components/auth/Segmented'
import Tag from '@/components/ui/Tag'
import styles from './Plan.module.css'

const FOCUS_TONE = { diabetic: 'sky', heart: 'leaf', pregnancy: 'plum', lose: 'ember' }

export default function PlanHeader({ weekOffset, onWeekChange, rangeText, targets, record, dateText, onOpenSettings }) {
  const { t } = useTranslation('plan')
  const focus = Object.entries(targets.focus).filter(([, on]) => on).map(([k]) => k)

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.headerTitle}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.range}>{rangeText}</p>
        </div>
        <div className={styles.headerActions}>
          <Segmented
            label={t('weekLabel')}
            value={weekOffset}
            onChange={onWeekChange}
            options={[
              { value: 0, label: t('thisWeek') },
              { value: 1, label: t('nextWeek') },
            ]}
          />
          <button type="button" className={styles.settingsButton} onClick={onOpenSettings}>
            <Settings2 size={18} strokeWidth={2} aria-hidden="true" />
            <span>{t('settingsButton')}</span>
          </button>
        </div>
      </div>

      <div className={styles.basis}>
        <span className={styles.basisIcon} aria-hidden="true">
          {record ? <Sparkles size={20} strokeWidth={2} /> : <ClipboardPlus size={20} strokeWidth={2} />}
        </span>
        <div className={styles.basisText}>
          <p className={styles.basisTitle}>{record ? t('basis.healthCheck', { date: dateText }) : t('basis.default')}</p>
          <div className={styles.basisTags}>
            <Tag tone="dark">{t('dailyTarget', { kcal: targets.kcal.toLocaleString() })}</Tag>
            {focus.map((f) => (
              <Tag key={f} tone={FOCUS_TONE[f]}>
                {t(`focus.${f}`)}
              </Tag>
            ))}
          </div>
        </div>
        <Link to="/health-check" className={styles.basisLink}>
          {record ? t('basis.retake') : t('basis.defaultCta')}
        </Link>
      </div>
    </header>
  )
}

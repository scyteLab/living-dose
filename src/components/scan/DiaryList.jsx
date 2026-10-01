import { useTranslation } from 'react-i18next'
import { ImageOff, Trash2 } from 'lucide-react'
import { lookup, totals } from '@/lib/scan/diary'
import { toIso } from '@/lib/mealPlan/storage'
import styles from './Scan.module.css'

export default function DiaryList({ entries, onRemove }) {
  const { t, i18n } = useTranslation('scan')
  const today = toIso(new Date())
  const todays = entries.filter((e) => e.date === today)
  const dayTotal = todays.reduce((n, e) => n + totals(e.items).kcal, 0)
  const time = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' })

  return (
    <section className={styles.diary} aria-labelledby="diary-h">
      <h2 id="diary-h" className={styles.panelTitle}>
        {t('diary.title')}
      </h2>
      {todays.length > 0 && <p className={styles.diaryTotal}>{t('diary.total', { kcal: dayTotal.toLocaleString() })}</p>}
      {todays.length === 0 ? (
        <p className={styles.muted}>{t('diary.empty')}</p>
      ) : (
        <ul className={styles.entries}>
          {todays.map((e) => (
            <li key={e.id} className={styles.entry}>
              {e.photo ? (
                <img src={e.photo} alt="" className={styles.entryPhoto} />
              ) : (
                <span className={styles.entryNoPhoto} aria-hidden="true">
                  <ImageOff size={18} strokeWidth={1.8} />
                </span>
              )}
              <div className={styles.entryText}>
                <strong>
                  {t(`review.slots.${e.slot}`)} · {time.format(new Date(e.time))}
                </strong>
                <span className={styles.small}>{e.items.map((it) => lookup(it)?.name).filter(Boolean).join(', ')}</span>
                <span className={styles.entryKcal}>{totals(e.items).kcal} kcal</span>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={t('diary.remove')}
                onClick={() => {
                  if (window.confirm(t('diary.removeConfirm'))) onRemove(e.id)
                }}
              >
                <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.small}>{t('diary.planNote')}</p>
    </section>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, BookmarkCheck, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import clsx from 'clsx'
import { loadFeedback, loadSaved, saveFeedback, toggleSaved } from '@/lib/learn/saved'
import styles from './Learn.module.css'

export function SaveButton({ itemKey, title }) {
  const { t } = useTranslation('learn')
  const [saved, setSaved] = useState(() => loadSaved().includes(itemKey))
  return (
    <button
      type="button"
      className={clsx(styles.action, saved && styles.actionOn)}
      aria-pressed={saved}
      aria-label={saved ? t('unsaveAria', { title }) : t('saveAria', { title })}
      onClick={() => setSaved(toggleSaved(itemKey).includes(itemKey))}
    >
      {saved ? <BookmarkCheck size={18} strokeWidth={2} aria-hidden="true" /> : <Bookmark size={18} strokeWidth={2} aria-hidden="true" />}
      {saved ? t('savedLabel') : t('save')}
    </button>
  )
}

export function ShareButton({ title, text }) {
  const { t } = useTranslation('learn')
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* closed the share sheet */
    }
  }
  return (
    <button type="button" className={styles.action} onClick={share}>
      <Share2 size={18} strokeWidth={2} aria-hidden="true" />
      <span aria-live="polite">{copied ? t('copied') : t('share')}</span>
    </button>
  )
}

export function Helpful({ itemKey }) {
  const { t } = useTranslation('learn')
  const [answer, setAnswer] = useState(() => loadFeedback(itemKey))
  const pick = (v) => {
    saveFeedback(itemKey, v)
    setAnswer(v)
  }
  return (
    <div className={styles.helpful}>
      {answer ? (
        <p role="status">{t('helpful.thanks')}</p>
      ) : (
        <>
          <p id={`helpful-${itemKey}`}>{t('helpful.question')}</p>
          <div role="group" aria-labelledby={`helpful-${itemKey}`} className={styles.helpfulButtons}>
            <button type="button" className={styles.action} onClick={() => pick('yes')}>
              <ThumbsUp size={17} strokeWidth={2} aria-hidden="true" />
              {t('helpful.yes')}
            </button>
            <button type="button" className={styles.action} onClick={() => pick('no')}>
              <ThumbsDown size={17} strokeWidth={2} aria-hidden="true" />
              {t('helpful.no')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

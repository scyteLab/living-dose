import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Square, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import { canSpeak, speak, stopSpeaking } from '@/lib/simple/speak'
import styles from './Simple.module.css'
import { formatLocale } from '@/i18n'

/**
 * "Read to me": reads the page (or the text given) aloud with the phone's voice.
 * floating: a round button that sits above the tab bar on every page.
 */
export default function ReadAloud({ text, floating = false, className }) {
  const { t, i18n } = useTranslation('simple')
  const { pathname } = useLocation()
  // The page being read; reading stops when the member moves to another page
  const [readingPath, setReadingPath] = useState(null)
  const speaking = readingPath === pathname
  const setSpeaking = (on) => setReadingPath(on ? pathname : null)

  useEffect(() => stopSpeaking(), [pathname])
  useEffect(() => () => stopSpeaking(), [])

  if (!canSpeak()) return null

  const toggle = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    const words = typeof text === 'function' ? text() : (text ?? document.getElementById('main')?.innerText ?? '')
    if (speak(words, { lang: formatLocale(i18n.language), onEnd: () => setSpeaking(false) })) setSpeaking(true)
  }

  const Icon = speaking ? Square : Volume2
  const label = speaking ? t('stopReading') : t('readAloud')
  return (
    <button
      type="button"
      className={clsx(floating ? styles.readFloat : styles.readBtn, speaking && styles.reading, className)}
      onClick={toggle}
      aria-pressed={speaking}
    >
      <Icon size={floating ? 26 : 22} strokeWidth={2.2} aria-hidden="true" />
      {floating ? <span className="sr-only">{label}</span> : label}
    </button>
  )
}

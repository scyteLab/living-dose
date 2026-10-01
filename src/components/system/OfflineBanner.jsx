import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'
import useOnline from '@/hooks/useOnline'
import styles from './System.module.css'

/** A banner when the connection drops, and a short "back online" message after. */
export default function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnline()
  const [showBack, setShowBack] = useState(false)
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    const show = setTimeout(() => setShowBack(true), 0)
    const hide = setTimeout(() => setShowBack(false), 3000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [online])

  if (online && !showBack) return null
  return (
    <div className={clsx(styles.banner, online && styles.bannerOnline)} role="status">
      {online ? <Wifi size={18} strokeWidth={2} aria-hidden="true" /> : <WifiOff size={18} strokeWidth={2} aria-hidden="true" />}
      {online ? t('system.backOnline') : t('system.offline')}
    </div>
  )
}

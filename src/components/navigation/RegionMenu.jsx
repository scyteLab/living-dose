import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Globe } from 'lucide-react'
import clsx from 'clsx'
import useRegion from '@/hooks/useRegion'
import { languages } from '@/config/navigation'
import RegionOptions from './RegionOptions'
import styles from './RegionMenu.module.css'

/** Desktop popover for country and language. */
export default function RegionMenu({ className }) {
  const { t } = useTranslation()
  const { region, language } = useRegion()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const panelId = useId()

  const regionName = t(`regions.${region}`)
  const languageName = languages.find((l) => l.code === language)?.label ?? 'English'

  useEffect(() => {
    if (!open) return

    // Move focus to the selected country when the panel opens
    panelRef.current?.querySelector('input:checked')?.focus()

    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={clsx(styles.wrap, className)}>
      <button
        ref={buttonRef}
        type="button"
        className={clsx(styles.trigger, open && styles.triggerOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={t('region.button', { region: regionName, language: languageName })}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{regionName}</span>
        <ChevronDown className={styles.chevron} size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div ref={panelRef} id={panelId} className={styles.panel} role="dialog" aria-label={t('region.title')}>
          <RegionOptions idPrefix="popover" />
        </div>
      )}
    </div>
  )
}

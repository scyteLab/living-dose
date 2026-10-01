import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import styles from './Dialog.module.css'

/**
 * Modal dialog on the native <dialog> element: focus is trapped inside,
 * Esc closes it, and focus returns to whatever opened it.
 * Opens as a bottom sheet on phones and a centred panel on larger screens.
 */
export default function Dialog({ open, onClose, title, description, footer, size = 'md', closeLabel = 'Close', children }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      document.body.style.overflow = 'hidden'
    } else if (!open && dialog.open) {
      dialog.close()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={clsx(styles.dialog, styles[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // A click on the dimmed backdrop (the dialog element itself) closes it
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

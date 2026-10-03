import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'

function CopyButton({ text, label, done }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {copied ? <Check size={16} strokeWidth={2.4} aria-hidden="true" /> : <Copy size={16} strokeWidth={2} aria-hidden="true" />}
      <span aria-live="polite">{copied ? done : label}</span>
    </Button>
  )
}

export default function OrgInvite() {
  const { org } = useOutletContext()
  const { t } = useTranslation('org')
  useDocumentTitle(t('invite.title'))
  const message = t('invite.message', { code: org.code })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('invite.title')}</h1>
      <p className={styles.muted}>{t('invite.intro')}</p>
      <section className={styles.panel}>
        <p className={styles.label}>{t('invite.code')}</p>
        <div className={styles.rowActions}>
          <span className={styles.code}>{org.code}</span>
          <CopyButton text={org.code} label={t('invite.copy')} done={t('invite.copied')} />
        </div>
      </section>
      <section className={styles.panel}>
        <p className={styles.label}>{t('invite.messageTitle')}</p>
        <p className={styles.messageBox}>{message}</p>
        <CopyButton text={message} label={t('invite.copyMessage')} done={t('invite.copied')} />
      </section>
      <section className={styles.panel}>
        <p className={styles.label}>{t('invite.steps')}</p>
        <ol className={styles.history}>
          {t('invite.stepsItems', { returnObjects: true }).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}

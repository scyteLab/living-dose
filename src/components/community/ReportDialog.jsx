import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import styles from './Community.module.css'

const REASONS = ['harmful', 'unkind', 'spam', 'private', 'other']

export default function ReportDialog({ open, onClose, onReport }) {
  const { t } = useTranslation('community')
  const [reason, setReason] = useState(null)

  return (
    <Dialog
      open={open}
      onClose={() => {
        setReason(null)
        onClose()
      }}
      title={t('report.title')}
      description={t('report.intro')}
      closeLabel={t('report.cancel')}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('report.cancel')}
          </Button>
          <Button
            disabled={!reason}
            onClick={() => {
              onReport(reason)
              setReason(null)
            }}
          >
            {t('report.submit')}
          </Button>
        </>
      }
    >
      <fieldset className={styles.reasons}>
        <legend className="sr-only">{t('report.title')}</legend>
        {REASONS.map((r) => (
          <label key={r} className={reason === r ? styles.reasonOn : styles.reason}>
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
            {t(`report.reasons.${r}`)}
          </label>
        ))}
      </fieldset>
    </Dialog>
  )
}

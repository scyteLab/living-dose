import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Field from '@/components/ui/Field'
import { saveFamily, validPhone } from '@/lib/simple/view'
import styles from './Simple.module.css'

/** Save one family member to call from Simple view. */
export default function FamilyDialog({ open, onClose, userId, family }) {
  const { t } = useTranslation('simple')
  return (
    <Dialog open={open} onClose={onClose} title={t('family.title')} description={t('family.body')} closeLabel={t('family.cancel')}>
      {open && <FamilyForm userId={userId} family={family} onDone={onClose} />}
    </Dialog>
  )
}

export function FamilyForm({ userId, family, onDone, compact = false }) {
  const { t } = useTranslation('simple')
  const [name, setName] = useState(family?.name ?? '')
  const [phone, setPhone] = useState(family?.phone ?? '')
  const [error, setError] = useState(false)

  return (
    <form
      className={styles.familyForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!validPhone(phone)) {
          setError(true)
          return
        }
        saveFamily(userId, { name, phone })
        onDone?.()
      }}
    >
      <Field label={t('family.name')}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('family.namePlaceholder')} autoComplete="off" maxLength={40} />
      </Field>
      <Field label={t('family.phone')} error={error ? t('family.phoneError') : null}>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setError(false)
          }}
          placeholder={t('family.phonePlaceholder')}
          autoComplete="off"
        />
      </Field>
      <div className={styles.familyActions}>
        <Button type="submit" size={compact ? 'md' : 'lg'}>
          {t('family.save')}
        </Button>
        {family && (
          <Button
            type="button"
            variant="outline"
            size={compact ? 'md' : 'lg'}
            onClick={() => {
              saveFamily(userId, null)
              onDone?.()
            }}
          >
            {t('family.remove')}
          </Button>
        )}
      </div>
    </form>
  )
}

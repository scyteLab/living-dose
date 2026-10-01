import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Segmented from '@/components/auth/Segmented'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { languages, regions } from '@/config/navigation'
import useRegion from '@/hooks/useRegion'
import { updateProfile } from '@/lib/auth'
import { displayPhone } from '@/lib/phone'
import styles from './Account.module.css'

export default function ProfileSection({ user }) {
  const { t } = useTranslation('account')
  const tc = useTranslation().t
  const { region, setRegion, language, setLanguage } = useRegion()
  const meta = user.user_metadata ?? {}
  const [name, setName] = useState(meta.first_name ?? '')
  const [units, setUnits] = useState(meta.units ?? 'metric')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(false)
  const phone = user.phone ? displayPhone(user.phone.startsWith('+') ? user.phone : `+${user.phone}`) : null

  const save = async (e) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean || clean.length > 40) {
      setError(true)
      return
    }
    setError(false)
    setStatus('saving')
    try {
      await updateProfile(user, { first_name: clean, units })
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <form className={styles.section} onSubmit={save} noValidate>
      <h2 className={styles.sectionTitle}>{t('profile.title')}</h2>
      <div className={styles.grid}>
        <Field label={t('profile.name')} hint={t('profile.nameHint')} error={error ? t('profile.nameError') : null}>
          <input
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setStatus('idle')
            }}
          />
        </Field>
        <div className={styles.readOnly}>
          <p className={styles.label}>{t('profile.phone')}</p>
          <p>{phone ?? t('profile.notSet')}</p>
          <p className={styles.label}>{t('profile.email')}</p>
          <p>{user.email || t('profile.notSet')}</p>
          <p className={styles.small}>{t('profile.contactHint')}</p>
        </div>
        <Field label={t('profile.language')} hint={t('profile.languageHint')}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages
              .filter((l) => l.available)
              .map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
          </select>
        </Field>
        <Field label={t('profile.region')} hint={t('profile.regionHint')}>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {tc(`regions.${r.code}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className={styles.block}>
        <p className={styles.label}>{t('profile.units')}</p>
        <Segmented
          label={t('profile.units')}
          value={units}
          onChange={(u) => {
            setUnits(u)
            setStatus('idle')
          }}
          options={['metric', 'imperial'].map((u) => ({ value: u, label: t(`profile.unitsOptions.${u}`) }))}
        />
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? t('saving') : t('save')}
        </Button>
        {status === 'saved' && (
          <span className={styles.saved} role="status">
            {t('saved')}
          </span>
        )}
      </div>
    </form>
  )
}

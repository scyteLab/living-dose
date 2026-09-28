import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { COUNTRIES, cleanDigits, findCountry, formatNational, isValidNational } from '@/lib/phone'
import styles from './PhoneField.module.css'

/**
 * Country code + phone number. Formats as the person types and turns green when complete.
 * `digits` is the raw national number; the parent keeps it in state.
 */
export default function PhoneField({ label, country, onCountryChange, digits, onDigitsChange, error, hint, autoFocus, inputRef }) {
  const { t } = useTranslation('auth')
  const id = useId()
  const valid = isValidNational(digits, country)
  const describedBy = error ? `${id}-error` : `${id}-hint`

  return (
    <div className={styles.field}>
      <label htmlFor={`${id}-number`} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <select
          className={styles.country}
          aria-label={t('phone.countryLabel')}
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          id={`${id}-number`}
          className={clsx(styles.input, valid && styles.valid, error && styles.invalid)}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={findCountry(country).example}
          value={formatNational(digits)}
          onChange={(e) => onDigitsChange(cleanDigits(e.target.value, country))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className={clsx(styles.hint, valid && styles.hintValid)}>
          {valid ? t('phone.looksGood') : hint}
        </p>
      )}
    </div>
  )
}

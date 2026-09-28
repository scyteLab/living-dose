import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import useRegion from '@/hooks/useRegion'
import { regions, languages } from '@/config/navigation'
import styles from './RegionOptions.module.css'

/**
 * Country and language choices as real radio groups
 * (arrow keys move between options, screen readers announce the group).
 * `idPrefix` keeps the radio names unique when rendered twice.
 */
export default function RegionOptions({ idPrefix }) {
  const { t } = useTranslation()
  const { region, setRegion, language, setLanguage } = useRegion()

  return (
    <div className={styles.options}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('region.country')}</legend>
        <p className={styles.hint}>{t('region.countryHint')}</p>
        <div className={styles.list}>
          {regions.map(({ code }) => (
            <label key={code} className={styles.option}>
              <input
                type="radio"
                className={styles.radio}
                name={`${idPrefix}-region`}
                value={code}
                checked={region === code}
                onChange={() => setRegion(code)}
              />
              <span className={styles.label}>{t(`regions.${code}`)}</span>
              <Check className={styles.check} size={18} strokeWidth={2.2} aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('region.language')}</legend>
        <div className={styles.list}>
          {languages.map(({ code, label, available }) => (
            <label key={code} className={styles.option} lang={code}>
              <input
                type="radio"
                className={styles.radio}
                name={`${idPrefix}-language`}
                value={code}
                checked={language === code}
                disabled={!available}
                onChange={() => setLanguage(code)}
              />
              <span className={styles.label}>{label}</span>
              {available ? (
                <Check className={styles.check} size={18} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <span className={styles.later} lang="en">
                  {t('region.later')}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

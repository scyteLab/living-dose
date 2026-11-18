import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FamilyForm } from '@/components/simple/FamilyDialog'
import ReadAloud from '@/components/simple/ReadAloud'
import { loadFamily, useSimpleView } from '@/lib/simple/view'
import styles from './Account.module.css'

/** Simple view, read-aloud and the family member to call. Saved on this phone. */
export default function DisplaySection({ user }) {
  const { t } = useTranslation('account')
  const [simple, setSimple] = useSimpleView(user.id)
  const [family, setFamily] = useState(() => loadFamily(user.id))
  const [saved, setSaved] = useState(false)

  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.sectionTitle}>{t('display.title')}</h2>
        <p className={styles.muted}>{t('display.intro')}</p>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t('display.viewLabel')}</legend>
        <label className={styles.toggle}>
          <span className={styles.toggleText}>
            <strong>{t('display.simple')}</strong>
            <span className={styles.small}>{t('display.simpleHint')}</span>
          </span>
          <input type="checkbox" role="switch" checked={simple} onChange={(e) => setSimple(e.target.checked)} />
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t('display.readLabel')}</legend>
        <p className={styles.small}>{t('display.readHint')}</p>
        <ReadAloud text={t('display.readSample')} className={styles.selfStart} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t('display.familyLabel')}</legend>
        <p className={styles.small}>{t('display.familyHint')}</p>
        <FamilyForm
          key={JSON.stringify(family)}
          userId={user.id}
          family={family}
          compact
          onDone={() => {
            setFamily(loadFamily(user.id))
            setSaved(true)
          }}
        />
        {saved && (
          <p className={styles.saved} role="status">
            {t('display.saved')}
          </p>
        )}
      </fieldset>
    </div>
  )
}

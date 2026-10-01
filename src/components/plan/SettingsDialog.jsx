import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import Segmented from '@/components/auth/Segmented'
import { MultiChoice } from '@/components/healthCheck/Controls'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import styles from './Plan.module.css'

const AVOID = ['pork', 'beef', 'chicken', 'fish', 'shellfish', 'egg', 'dairy', 'nuts']

export default function SettingsDialog({ open, settings, onSave, onClose }) {
  const { t } = useTranslation('plan')
  return (
    <Dialog open={open} onClose={onClose} title={t('settings.title')} description={t('settings.intro')} closeLabel={t('settings.cancel')}>
      {/* Remount the form each time it opens so it starts from the saved settings */}
      {open && <SettingsForm settings={settings} onSave={onSave} onClose={onClose} />}
    </Dialog>
  )
}

function SettingsForm({ settings, onSave, onClose }) {
  const { t } = useTranslation('plan')
  const [draft, setDraft] = useState(settings)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const toggleAvoid = (id) => set({ avoid: draft.avoid.includes(id) ? draft.avoid.filter((x) => x !== id) : [...draft.avoid, id] })

  return (
    <form
      className={styles.settings}
      onSubmit={(e) => {
        e.preventDefault()
        onSave(draft)
      }}
    >
      <div className={styles.settingRow}>
        <span id="household-label" className={styles.settingLabel}>
          {t('settings.household')}
        </span>
        <div className={styles.stepper} role="group" aria-labelledby="household-label">
          <button type="button" onClick={() => set({ household: Math.max(1, draft.household - 1) })} aria-label={t('settings.fewer')} disabled={draft.household <= 1}>
            <Minus size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <span aria-live="polite">{draft.household}</span>
          <button type="button" onClick={() => set({ household: Math.min(12, draft.household + 1) })} aria-label={t('settings.more')}>
            <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.settingBlock}>
        <span className={styles.settingLabel}>{t('settings.budget')}</span>
        <Segmented
          label={t('settings.budget')}
          value={draft.budget}
          onChange={(budget) => set({ budget })}
          options={['low', 'balanced', 'flexible'].map((v) => ({ value: v, label: t(`settings.budgetOptions.${v}`) }))}
        />
        <p className={styles.muted}>{t('settings.budgetHint')}</p>
      </div>

      <MultiChoice
        legend={t('settings.avoid')}
        help={t('settings.avoidHint')}
        options={AVOID.map((id) => ({ value: id, label: t(`settings.avoidOptions.${id}`) }))}
        values={draft.avoid}
        onToggle={toggleAvoid}
      />

      <label className={styles.switchRow}>
        <span className={styles.settingLabel}>{t('settings.snacks')}</span>
        <input type="checkbox" role="switch" checked={draft.snacks} onChange={(e) => set({ snacks: e.target.checked })} />
      </label>

      <div className={styles.settingsActions}>
        <Button variant="outline" onClick={onClose}>
          {t('settings.cancel')}
        </Button>
        <Button type="submit">{t('settings.save')}</Button>
      </div>
    </form>
  )
}

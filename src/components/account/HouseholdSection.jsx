import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe2, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import Segmented from '@/components/auth/Segmented'
import { MultiChoice } from '@/components/healthCheck/Controls'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Field from '@/components/ui/Field'
import { AGE_GROUPS, AVOIDS, RELATIONSHIPS, loadHousehold, saveHousehold, validateMember } from '@/lib/account/settings'
import { loadPlanStore, savePlanStore } from '@/lib/mealPlan/storage'
import styles from './Account.module.css'

const EMPTY = { name: '', relationship: '', ageGroup: '', avoid: [], lives: 'home' }

function MemberForm({ initial, onSave, onCancel }) {
  const { t } = useTranslation('account')
  const [m, setM] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (patch) => setM((x) => ({ ...x, ...patch }))

  return (
    <form
      className={styles.memberForm}
      onSubmit={(e) => {
        e.preventDefault()
        const found = validateMember(m)
        setErrors(found)
        if (!Object.keys(found).length) onSave({ ...m, name: m.name.trim() })
      }}
      noValidate
    >
      <Field label={t('household.form.name')} error={errors.name ? t('household.form.errors.name') : null}>
        <input type="text" value={m.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label={t('household.form.relationship')} error={errors.relationship ? t('household.form.errors.relationship') : null}>
        <select value={m.relationship} onChange={(e) => set({ relationship: e.target.value })}>
          <option value="" disabled>
            …
          </option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {t(`household.relationships.${r}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('household.form.ageGroup')} error={errors.ageGroup ? t('household.form.errors.ageGroup') : null}>
        <select value={m.ageGroup} onChange={(e) => set({ ageGroup: e.target.value })}>
          <option value="" disabled>
            …
          </option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a}>
              {t(`household.ageGroups.${a}`)}
            </option>
          ))}
        </select>
      </Field>
      {(m.ageGroup === 'child' || m.ageGroup === 'teen') && <p className={styles.note}>{t('household.childNote')}</p>}
      <div className={styles.block}>
        <p className={styles.label}>{t('household.form.lives')}</p>
        <Segmented label={t('household.form.lives')} value={m.lives} onChange={(lives) => set({ lives })} options={['home', 'nigeria', 'abroad'].map((v) => ({ value: v, label: t(`household.form.livesOptions.${v}`) }))} />
      </div>
      <MultiChoice
        legend={t('household.form.avoid')}
        options={AVOIDS.map((a) => ({ value: a, label: t(`household.avoidOptions.${a}`) }))}
        values={m.avoid}
        onToggle={(a) => set({ avoid: m.avoid.includes(a) ? m.avoid.filter((x) => x !== a) : [...m.avoid, a] })}
      />
      <div className={styles.actions}>
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  )
}

export default function HouseholdSection({ user }) {
  const { t } = useTranslation('account')
  const [members, setMembers] = useState(() => loadHousehold(user.id))
  const [editing, setEditing] = useState(null) // null | 'new' | member id
  const [planCount, setPlanCount] = useState(() => loadPlanStore(user.id).settings.household)
  const [notice, setNotice] = useState(null)
  const cooking = 1 + members.filter((m) => m.lives === 'home').length

  const commit = (next) => {
    setMembers(next)
    saveHousehold(user.id, next)
  }
  const current = editing && editing !== 'new' ? members.find((m) => m.id === editing) : null

  const usePlanCount = () => {
    const store = loadPlanStore(user.id)
    savePlanStore(user.id, { ...store, settings: { ...store.settings, household: cooking } })
    setPlanCount(cooking)
    setNotice(t('household.planUpdated', { count: cooking }))
  }

  return (
    <section className={styles.section} aria-labelledby="household-h">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="household-h" className={styles.sectionTitle}>
            {t('household.title')}
          </h2>
          <p className={styles.muted}>{t('household.intro')}</p>
        </div>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
          {t('household.add')}
        </Button>
      </div>

      <ul className={styles.members}>
        <li className={styles.member}>
          <span className={styles.memberAvatar} aria-hidden="true">
            {(user.user_metadata?.first_name ?? '?')[0]}
          </span>
          <div className={styles.memberText}>
            <strong>{user.user_metadata?.first_name ?? t('household.you')}</strong>
            <span className={styles.small}>{t('household.you')}</span>
          </div>
        </li>
        {members.map((m) => (
          <li key={m.id} className={styles.member}>
            <span className={styles.memberAvatar} aria-hidden="true">
              {m.lives === 'abroad' || m.lives === 'nigeria' ? <Globe2 size={18} strokeWidth={2} /> : m.name[0]}
            </span>
            <div className={styles.memberText}>
              <strong>{m.name}</strong>
              <span className={styles.small}>
                {t(`household.relationships.${m.relationship}`)} · {t(`household.ageGroups.${m.ageGroup}`)} · {t(`household.form.livesOptions.${m.lives}`)}
                {m.avoid.length > 0 && ` · ${m.avoid.map((a) => t(`household.avoidOptions.${a}`)).join(', ')}`}
              </span>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => setEditing(m.id)} aria-label={`${t('household.edit')} ${m.name}`}>
              <Pencil size={17} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`${t('household.remove')} ${m.name}`}
              onClick={() => {
                if (window.confirm(t('household.removeConfirm', { name: m.name }))) commit(members.filter((x) => x.id !== m.id))
              }}
            >
              <Trash2 size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {members.length === 0 && <p className={styles.muted}>{t('household.empty')}</p>}

      <div className={styles.callout}>
        <UsersRound size={22} strokeWidth={1.8} aria-hidden="true" />
        <div className={styles.calloutText}>
          <p className={styles.label}>{t('household.planTitle')}</p>
          <p className={styles.small}>{t('household.planBody', { count: planCount })}</p>
          {notice && (
            <p className={styles.saved} role="status">
              {notice}
            </p>
          )}
        </div>
        {cooking !== planCount && (
          <Button size="sm" variant="outline" onClick={usePlanCount}>
            {t('household.planUse', { count: cooking })}
          </Button>
        )}
      </div>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={current ? t('household.form.editTitle', { name: current.name }) : t('household.form.addTitle')}
        closeLabel={t('cancel')}
      >
        {editing && (
          <MemberForm
            initial={current ?? EMPTY}
            onCancel={() => setEditing(null)}
            onSave={(m) => {
              commit(current ? members.map((x) => (x.id === current.id ? { ...m, id: current.id } : x)) : [...members, { ...m, id: `m-${Date.now().toString(36)}` }])
              setEditing(null)
            }}
          />
        )}
      </Dialog>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { ORG_SIZES, SETTING_GROUPS, groupOf } from '@/data/shuttleSettings'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import styles from './Shuttle.module.css'

export const ORG_TOPIC = 'shuttle-meds-org'
const EMPTY = { org: '', person: '', contact: '', setting: 'offices', state: 'Lagos', town: '', size: '50to200', needs: [], message: '' }

/** "Bring Shuttle Meds to your place": requests from companies, schools, communities and events. */
export default function OrgRequestForm({ states, services, initialSetting }) {
  const { t } = useTranslation('shuttle')
  const [form, setForm] = useState(() => ({ ...EMPTY, setting: initialSetting ?? EMPTY.setting }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    const contact = form.contact.trim()
    const found = {}
    if (!form.org.trim()) found.org = true
    if (!form.person.trim()) found.person = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, '').length < 10) found.contact = true
    setErrors(found)
    if (Object.keys(found).length) return

    const details = {
      org: form.org.trim(),
      setting: form.setting,
      group: groupOf(form.setting),
      state: form.state,
      town: form.town.trim(),
      size: form.size,
      needs: form.needs,
    }
    const message = [
      `Shuttle Meds request from ${details.org}`,
      `Place: ${t(`settings.${form.setting}`)}`,
      `Where: ${form.state}${details.town ? `, ${details.town}` : ''}`,
      `People: ${t(`org.sizes.${form.size}`)}`,
      `Needs: ${form.needs.length ? form.needs.join(', ') : 'everything'}`,
      form.message.trim() ? `\n${form.message.trim()}` : '',
    ]
      .join('\n')
      .trim()

    setStatus('sending')
    if (isSupabaseConfigured) {
      const isEmail = contact.includes('@')
      const row = { name: form.person.trim(), email: contact, phone: isEmail ? null : contact, topic: ORG_TOPIC, message }
      let { error } = await supabase.from('contact_messages').insert({ ...row, details })
      if (error && /details/i.test(error.message ?? '')) ({ error } = await supabase.from('contact_messages').insert(row))
      setStatus(error ? 'error' : 'done')
      return
    }
    try {
      const list = JSON.parse(window.localStorage.getItem('ld.shuttle.orgs') ?? '[]')
      window.localStorage.setItem(
        'ld.shuttle.orgs',
        JSON.stringify([...list, { ...details, name: form.person.trim(), contact, message, at: new Date().toISOString() }]),
      )
    } catch {
      /* demo only */
    }
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <p className={styles.thanks} role="status">
        <CheckCircle2 size={22} strokeWidth={2.2} aria-hidden="true" />
        {t('org.thanks', { org: form.org.trim() })}
      </p>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.field}>
        <span>{t('org.orgName')}</span>
        <input value={form.org} onChange={(e) => set({ org: e.target.value })} autoComplete="organization" aria-invalid={errors.org || undefined} />
        {errors.org && <small className={styles.error}>{t('org.orgNameError')}</small>}
      </label>
      <label className={styles.field}>
        <span>{t('org.setting')}</span>
        <select value={form.setting} onChange={(e) => set({ setting: e.target.value })}>
          {SETTING_GROUPS.map((g) => (
            <optgroup key={g.id} label={t(`groups.${g.id}.title`)}>
              {g.settings.map((s) => (
                <option key={s} value={s}>
                  {t(`settings.${s}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>{t('org.person')}</span>
          <input value={form.person} onChange={(e) => set({ person: e.target.value })} autoComplete="name" aria-invalid={errors.person || undefined} />
          {errors.person && <small className={styles.error}>{t('org.personError')}</small>}
        </label>
        <label className={styles.field}>
          <span>{t('org.contact')}</span>
          <input
            value={form.contact}
            onChange={(e) => set({ contact: e.target.value })}
            autoComplete="email"
            inputMode="email"
            aria-invalid={errors.contact || undefined}
          />
          {errors.contact && <small className={styles.error}>{t('org.contactError')}</small>}
        </label>
      </div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>{t('org.state')}</span>
          <select value={form.state} onChange={(e) => set({ state: e.target.value })}>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>
            {t('org.town')} <em>{t('form.optional')}</em>
          </span>
          <input value={form.town} onChange={(e) => set({ town: e.target.value })} placeholder={t('org.townPlaceholder')} />
        </label>
        <label className={styles.field}>
          <span>{t('org.size')}</span>
          <select value={form.size} onChange={(e) => set({ size: e.target.value })}>
            {ORG_SIZES.map((s) => (
              <option key={s} value={s}>
                {t(`org.sizes.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className={styles.fieldset}>
        <legend>{t('org.needs')}</legend>
        {services.map((sid) => (
          <Checkbox
            key={sid}
            checked={form.needs.includes(sid)}
            onChange={(v) => set({ needs: v ? [...form.needs, sid] : form.needs.filter((x) => x !== sid) })}
          >
            {t(`services.${sid}.title`)}
          </Checkbox>
        ))}
      </fieldset>
      <label className={styles.field}>
        <span>
          {t('org.message')} <em>{t('form.optional')}</em>
        </span>
        <textarea
          className={styles.textarea}
          rows={3}
          maxLength={2000}
          value={form.message}
          onChange={(e) => set({ message: e.target.value })}
          placeholder={t('org.messagePlaceholder')}
        />
      </label>
      {status === 'error' && (
        <p className={styles.error} role="alert">
          {t('org.failed')}
        </p>
      )}
      <Button type="submit" variant="action" disabled={status === 'sending'}>
        {status === 'sending' ? t('org.sending') : t('org.submit')}
      </Button>
      <p className={styles.small}>
        {t('form.privacy')} <Link to="/privacy">{t('form.privacyLink')}</Link>
      </p>
    </form>
  )
}

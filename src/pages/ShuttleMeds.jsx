import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Ambulance, Building2, CheckCircle2, Church, GraduationCap, House, PartyPopper, PhoneCall, Stethoscope, Truck, Video } from 'lucide-react'
import clsx from 'clsx'
import styles from '@/components/shuttle/Shuttle.module.css'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import OrgRequestForm from '@/components/shuttle/OrgRequestForm'
import { SETTING_GROUPS } from '@/data/shuttleSettings'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const SERVICES = [
  { id: 'emergency', icon: Ambulance, tone: 'berry' },
  { id: 'doctorCall', icon: Video, tone: 'sky' },
  { id: 'mobileClinic', icon: Truck, tone: 'leaf' },
  { id: 'medicines', icon: Stethoscope, tone: 'ember' },
]
const GROUP_ICONS = { Building2, GraduationCap, Church, House, PartyPopper }
const STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'FCT Abuja', 'Kwara', 'Rivers', 'Kano', 'Kaduna', 'Enugu', 'Anambra', 'Other']

/** /shuttle-meds: coming soon, with a waitlist. */
export default function ShuttleMeds() {
  const { t } = useTranslation('shuttle')
  useDocumentTitle(t('docTitle'), t('metaDescription'))
  const id = useId()
  const [form, setForm] = useState({ name: '', contact: '', state: 'Lagos', community: '', interests: [], who: 'self' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const [orgSetting, setOrgSetting] = useState(null)
  const bring = (setting) => {
    if (setting) setOrgSetting(setting)
    document.getElementById('bring')?.scrollIntoView({ behavior: 'smooth' })
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.name.trim()) found.name = true
    const contact = form.contact.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, '').length < 10) found.contact = true
    setErrors(found)
    if (Object.keys(found).length) return

    const message = [
      `Shuttle Meds waitlist`,
      `State: ${form.state}${form.community.trim() ? `, ${form.community.trim()}` : ''}`,
      `Interested in: ${form.interests.length ? form.interests.join(', ') : 'everything'}`,
      `Signing up for: ${form.who}`,
    ].join('\n')
    setStatus('sending')
    if (isSupabaseConfigured) {
      const isEmail = contact.includes('@')
      const row = { name: form.name.trim(), email: contact, phone: isEmail ? null : contact, topic: 'shuttle-meds', message }
      const details = { state: form.state, community: form.community.trim(), interests: form.interests, who: form.who }
      let { error } = await supabase.from('contact_messages').insert({ ...row, details })
      // Before migration 0013 the details column doesn't exist yet: the message text still has everything
      if (error && /details/i.test(error.message ?? '')) ({ error } = await supabase.from('contact_messages').insert(row))
      setStatus(error ? 'error' : 'done')
      return
    }
    try {
      const list = JSON.parse(window.localStorage.getItem('ld.shuttle.waitlist') ?? '[]')
      window.localStorage.setItem('ld.shuttle.waitlist', JSON.stringify([...list, { ...form, at: new Date().toISOString() }]))
    } catch {
      /* demo only */
    }
    setStatus('done')
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>{t('badge')}</span>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
        <div className={styles.heroActions}>
          <Button variant="action" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('joinWaitlist')}
          </Button>
          <Button to="/care" variant="outline">
            {t('talkNow')}
          </Button>
        </div>
      </section>

      <p className={styles.emergency} role="note">
        <PhoneCall size={20} strokeWidth={2} aria-hidden="true" />
        <span>
          <strong>{t('emergencyTitle')}</strong> {t('emergencyBody')} <a href="tel:112">{t('call112')}</a>
        </span>
      </p>

      <section aria-labelledby="what-h" className={styles.section}>
        <h2 id="what-h" className={styles.sectionTitle}>
          {t('whatTitle')}
        </h2>
        <ul className={styles.services}>
          {SERVICES.map(({ id: sid, icon: Icon, tone }) => (
            <li key={sid} className={styles.service}>
              <span className={clsx(styles.serviceIcon, styles[`tone_${tone}`])} aria-hidden="true">
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <h3>{t(`services.${sid}.title`)}</h3>
              <p>{t(`services.${sid}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-h" className={styles.section}>
        <h2 id="how-h" className={styles.sectionTitle}>
          {t('howTitle')}
        </h2>
        <ol className={styles.steps}>
          {t('steps', { returnObjects: true }).map((step) => (
            <li key={step.t}>
              <strong>{step.t}</strong>
              <span>{step.b}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="where-h" className={styles.section}>
        <h2 id="where-h" className={styles.sectionTitle}>
          {t('whereTitle')}
        </h2>
        <p className={styles.muted}>{t('whereBody')}</p>
        <ul className={styles.groups}>
          {SETTING_GROUPS.map((g) => {
            const Icon = GROUP_ICONS[g.icon]
            return (
              <li key={g.id} className={styles.group}>
                <span className={styles.soon}>{t('comingSoon')}</span>
                <span className={clsx(styles.serviceIcon, styles[`tone_${g.tone}`])} aria-hidden="true">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <h3>{t(`groups.${g.id}.title`)}</h3>
                <p>{t(`groups.${g.id}.body`)}</p>
                <ul className={styles.places}>
                  {g.settings.map((sid) => (
                    <li key={sid}>
                      <button type="button" className={styles.place} onClick={() => bring(sid)}>
                        {t(`settings.${sid}`)}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
        <Button variant="outline" className={styles.whereCta} onClick={() => bring()}>
          {t('bringCta')}
        </Button>
      </section>

      <section id="waitlist" aria-labelledby="waitlist-h" className={styles.waitlist}>
        <h2 id="waitlist-h" className={styles.sectionTitle}>
          {t('waitlistTitle')}
        </h2>
        <p className={styles.muted}>{t('waitlistBody')}</p>
        {status === 'done' ? (
          <p className={styles.thanks} role="status">
            <CheckCircle2 size={22} strokeWidth={2.2} aria-hidden="true" />
            {t('thanks', { name: form.name.trim().split(' ')[0] })}
          </p>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            <label className={styles.field}>
              <span>{t('form.name')}</span>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" aria-invalid={errors.name || undefined} />
              {errors.name && <small className={styles.error}>{t('form.nameError')}</small>}
            </label>
            <label className={styles.field}>
              <span>{t('form.contact')}</span>
              <input
                value={form.contact}
                onChange={(e) => set({ contact: e.target.value })}
                autoComplete="email"
                inputMode="email"
                placeholder={t('form.contactPlaceholder')}
                aria-invalid={errors.contact || undefined}
              />
              {errors.contact && <small className={styles.error}>{t('form.contactError')}</small>}
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>{t('form.state')}</span>
                <select value={form.state} onChange={(e) => set({ state: e.target.value })}>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>
                  {t('form.community')} <em>{t('form.optional')}</em>
                </span>
                <input value={form.community} onChange={(e) => set({ community: e.target.value })} placeholder={t('form.communityPlaceholder')} />
              </label>
            </div>
            <fieldset className={styles.fieldset}>
              <legend>{t('form.interests')}</legend>
              {SERVICES.map(({ id: sid }) => (
                <Checkbox
                  key={sid}
                  checked={form.interests.includes(sid)}
                  onChange={(v) => set({ interests: v ? [...form.interests, sid] : form.interests.filter((x) => x !== sid) })}
                >
                  {t(`services.${sid}.title`)}
                </Checkbox>
              ))}
            </fieldset>
            <label className={styles.field}>
              <span>{t('form.who')}</span>
              <select id={`${id}-who`} value={form.who} onChange={(e) => set({ who: e.target.value })}>
                {['self', 'family', 'community', 'organisation'].map((w) => (
                  <option key={w} value={w}>
                    {t(`form.whoOptions.${w}`)}
                  </option>
                ))}
              </select>
            </label>
            {status === 'error' && (
              <p className={styles.error} role="alert">
                {t('form.failed')}
              </p>
            )}
            <Button type="submit" variant="action" disabled={status === 'sending'}>
              {status === 'sending' ? t('form.sending') : t('joinWaitlist')}
            </Button>
            <p className={styles.small}>
              {t('form.privacy')} <Link to="/privacy">{t('form.privacyLink')}</Link>
            </p>
          </form>
        )}
      </section>

      <section id="bring" aria-labelledby="bring-h" className={styles.waitlist}>
        <h2 id="bring-h" className={styles.sectionTitle}>
          {t('org.title')}
        </h2>
        <p className={styles.muted}>{t('org.body')}</p>
        <OrgRequestForm key={orgSetting ?? 'none'} states={STATES} services={SERVICES.map((x) => x.id)} initialSetting={orgSetting ?? undefined} />
      </section>
    </div>
  )
}

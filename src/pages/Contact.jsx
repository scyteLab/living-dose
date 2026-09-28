import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import PageIntro from '@/components/page/PageIntro'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { site } from '@/config/site'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import styles from './Contact.module.css'

const TOPICS = ['general', 'order', 'consultation', 'account', 'partnership', 'press', 'other']
const EMPTY = { name: '', email: '', phone: '', topic: 'general', message: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values, t) {
  const errors = {}
  if (!values.name.trim()) errors.name = t('contact.errors.name')
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t('contact.errors.email')
  if (values.message.trim().length < 10) errors.message = t('contact.errors.message')
  return errors
}

/**
 * Sending: with Supabase connected, messages are saved to a `contact_messages` table.
 * Before the backend exists, the form opens the visitor's email app with the message ready,
 * so nothing is ever silently lost.
 */
export default function Contact() {
  const { t } = useTranslation()
  useDocumentTitle(t('contact.docTitle'))

  const [params] = useSearchParams()
  const initialTopic = TOPICS.includes(params.get('topic')) ? params.get('topic') : 'general'

  const [values, setValues] = useState({ ...EMPTY, topic: initialTopic })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | mail | error
  const [failedAttempts, setFailedAttempts] = useState(0)

  // After a failed submit, take keyboard and screen reader users to the first problem
  useEffect(() => {
    if (failedAttempts > 0) document.querySelector('form [aria-invalid="true"]')?.focus()
  }, [failedAttempts])

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values, t)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFailedAttempts((n) => n + 1)
      return
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      topic: values.topic,
      message: values.message.trim(),
    }

    if (isSupabaseConfigured) {
      setStatus('sending')
      const { error } = await supabase.from('contact_messages').insert(payload)
      setStatus(error ? 'error' : 'sent')
      return
    }

    const subject = `${t(`contact.topics.${payload.topic}`)}: ${payload.name}`
    const body = `${payload.message}\n\n${payload.name}\n${payload.email}${payload.phone ? `\n${payload.phone}` : ''}`
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setStatus('mail')
  }

  const reset = () => {
    setValues({ ...EMPTY, topic: initialTopic })
    setStatus('idle')
  }

  const done = status === 'sent' || status === 'mail'

  return (
    <div className={styles.page}>
      <PageIntro eyebrow={t('contact.eyebrow')} title={t('contact.title')} intro={t('contact.intro')} />

      <div className={styles.layout}>
        <section className={styles.formCard} aria-labelledby="contact-form-title">
          {done ? (
            <div className={styles.done} role="status">
              <span className={styles.doneIcon} aria-hidden="true">
                <Send size={26} strokeWidth={1.8} />
              </span>
              <h2 className={styles.doneTitle}>{status === 'sent' ? t('contact.sentTitle') : t('contact.mailTitle')}</h2>
              <p className={styles.doneBody}>
                {status === 'sent' ? t('contact.sentBody', { email: values.email }) : t('contact.mailBody')}
              </p>
              <Button variant="outline" onClick={reset}>
                {t('contact.sendAnother')}
              </Button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <h2 id="contact-form-title" className={styles.formTitle}>
                {t('contact.formTitle')}
              </h2>

              <div className={styles.row}>
                <Field label={t('contact.name')} error={errors.name}>
                  <input type="text" autoComplete="name" value={values.name} onChange={update('name')} />
                </Field>
                <Field label={t('contact.email')} error={errors.email}>
                  <input type="email" autoComplete="email" inputMode="email" value={values.email} onChange={update('email')} />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label={t('contact.phone')} optionalLabel={t('contact.optional')}>
                  <input type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={update('phone')} />
                </Field>
                <Field label={t('contact.topic')}>
                  <select value={values.topic} onChange={update('topic')}>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {t(`contact.topics.${topic}`)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={t('contact.message')} hint={t('contact.messageHint')} error={errors.message}>
                <textarea rows={6} value={values.message} onChange={update('message')} />
              </Field>

              {status === 'error' && (
                <p className={styles.sendError} role="alert">
                  {t('contact.errors.send')}
                </p>
              )}

              <Button type="submit" variant="primary" className={styles.submit} disabled={status === 'sending'}>
                {status === 'sending' ? t('contact.sending') : t('contact.send')}
                <Send size={17} strokeWidth={2} aria-hidden="true" />
              </Button>
            </form>
          )}
        </section>

        <aside className={styles.side}>
          <div className={styles.emergency} role="note">
            <CircleAlert size={22} strokeWidth={2} aria-hidden="true" />
            <div>
              <p className={styles.emergencyTitle}>{t('contact.emergencyTitle')}</p>
              <p>{t('contact.emergencyBody', { number: site.emergencyNumber })}</p>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t('contact.reachTitle')}</h2>
            <ul className={styles.methods}>
              {site.email && (
                <li>
                  <Mail size={20} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className={styles.methodLabel}>{t('contact.emailLabel')}</span>
                    <a href={`mailto:${site.email}`}>{site.email}</a>
                  </div>
                </li>
              )}
              {site.phone && (
                <li>
                  <Phone size={20} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className={styles.methodLabel}>{t('contact.phoneLabel')}</span>
                    <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a>
                  </div>
                </li>
              )}
              {site.whatsapp && (
                <li>
                  <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className={styles.methodLabel}>{t('contact.whatsappLabel')}</span>
                    <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
                      {t('contact.whatsappCta')}
                    </a>
                  </div>
                </li>
              )}
              {site.address && (
                <li>
                  <MapPin size={20} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className={styles.methodLabel}>{t('contact.officeLabel')}</span>
                    <span>{site.address}</span>
                  </div>
                </li>
              )}
              {site.hours && (
                <li>
                  <Clock size={20} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className={styles.methodLabel}>{t('contact.hoursLabel')}</span>
                    <span>{site.hours}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className={styles.faq}>
            <p className={styles.cardTitle}>{t('contact.faqTitle')}</p>
            <p className={styles.faqBody}>{t('contact.faqBody')}</p>
            <Link to="/faq" className={styles.faqLink}>
              {t('contact.faqCta')} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

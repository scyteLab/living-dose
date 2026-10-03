import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Banknote, CalendarClock, MapPin } from 'lucide-react'
import clsx from 'clsx'
import styles from '@/components/shop/Shop.module.css'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { shop } from '@/config/shop'
import useAuth from '@/hooks/useAuth'
import useCart from '@/hooks/useCart'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { deliverySlots, placeOrder } from '@/lib/shop/orders'
import { displayPhone } from '@/lib/phone'
import { OrderSummary } from './BasketPage'

const ADDRESS_KEY = 'ld.lastAddress'

function savedAddress() {
  try {
    return JSON.parse(window.localStorage.getItem(ADDRESS_KEY))
  } catch {
    return null
  }
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation('shop')
  useDocumentTitle(t('checkout.docTitle'))
  const navigate = useNavigate()
  const { user, firstName } = useAuth()
  const { basket, totals, clear } = useCart()

  const [address, setAddress] = useState(
    () =>
      savedAddress() ?? {
        name: firstName,
        phone: user?.phone ? displayPhone(`+${user.phone.replace(/^\+/, '')}`) : '',
        street: '',
        area: '',
        city: '',
        state: shop.deliveryStates[0],
        landmark: '',
      },
  )
  const [slot, setSlot] = useState(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [status, setStatus] = useState('idle')
  const [attempts, setAttempts] = useState(0)
  const days = useMemo(() => deliverySlots({ days: shop.daysAhead, slots: shop.slots }), [])
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }), [i18n.language])

  // After a failed submit, move to the first problem
  useEffect(() => {
    if (attempts > 0) document.querySelector('[aria-invalid="true"], [data-invalid="true"] input')?.focus()
  }, [attempts])

  if (totals.itemCount === 0 && status !== 'placed') return <Navigate to="/basket" replace />

  const set = (key) => (e) => {
    setAddress((a) => ({ ...a, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    for (const k of ['name', 'street', 'area', 'city']) if (!address[k]?.trim()) found[k] = t('checkout.errors.required')
    if (address.phone.replace(/\D/g, '').length < 10) found.phone = t('checkout.errors.phone')
    if (!slot) found.slot = t('checkout.errors.slot')
    setErrors(found)
    if (Object.keys(found).length) {
      setAttempts((n) => n + 1)
      return
    }
    setStatus('placing')
    try {
      const clean = Object.fromEntries(Object.entries(address).map(([k, v]) => [k, v.trim()]))
      const order = await placeOrder(user.id, { basket, address: clean, slot, payment: 'payOnDelivery', note })
      window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(clean))
      setStatus('placed')
      clear()
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } })
    } catch (err) {
      setServerError(['invalid-slot', 'outside-delivery-area', 'unavailable-product', 'invalid-quantity'].includes(err?.kind) ? err.kind : null)
      setStatus('error')
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('checkout.title')}</h1>

      <form className={styles.checkoutLayout} onSubmit={onSubmit} noValidate>
        <div className={styles.checkoutMain}>
          <section className={styles.panel} aria-labelledby="address-title">
            <h2 id="address-title" className={styles.panelTitle}>
              <MapPin size={20} strokeWidth={2} aria-hidden="true" />
              {t('checkout.addressTitle')}
            </h2>
            <div className={styles.formGrid}>
              <Field label={t('checkout.name')} error={errors.name}>
                <input type="text" autoComplete="name" value={address.name} onChange={set('name')} />
              </Field>
              <Field label={t('checkout.phone')} hint={t('checkout.phoneHint')} error={errors.phone}>
                <input type="tel" autoComplete="tel" inputMode="tel" value={address.phone} onChange={set('phone')} />
              </Field>
              <Field label={t('checkout.street')} error={errors.street} className={styles.span2}>
                <input type="text" autoComplete="address-line1" value={address.street} onChange={set('street')} />
              </Field>
              <Field label={t('checkout.area')} error={errors.area}>
                <input type="text" autoComplete="address-level3" value={address.area} onChange={set('area')} />
              </Field>
              <Field label={t('checkout.city')} error={errors.city}>
                <input type="text" autoComplete="address-level2" value={address.city} onChange={set('city')} />
              </Field>
              <Field label={t('checkout.state')} hint={t('checkout.deliveryNote', { states: shop.deliveryStates.join(', ') })}>
                <select value={address.state} onChange={set('state')}>
                  {shop.deliveryStates.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('checkout.landmark')} optionalLabel="(optional)">
                <input type="text" value={address.landmark} onChange={set('landmark')} />
              </Field>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="slot-title">
            <h2 id="slot-title" className={styles.panelTitle}>
              <CalendarClock size={20} strokeWidth={2} aria-hidden="true" />
              {t('checkout.slotTitle')}
            </h2>
            <p className={styles.muted}>{t('checkout.slotHint')}</p>
            <fieldset className={styles.slots} data-invalid={errors.slot ? 'true' : undefined} aria-describedby={errors.slot ? 'slot-error' : undefined}>
              <legend className="sr-only">{t('checkout.slotTitle')}</legend>
              {days.map((day) => {
                const [y, m, d] = day.date.split('-').map(Number)
                return (
                  <div key={day.date} className={styles.slotDay}>
                    <p className={styles.slotDate}>{dayFmt.format(new Date(y, m - 1, d))}</p>
                    {day.slots.map((s) => (
                      <label key={s.id} className={clsx(styles.slot, slot === s.id && styles.slotOn)}>
                        <input
                          type="radio"
                          name="slot"
                          value={s.id}
                          checked={slot === s.id}
                          onChange={() => {
                            setSlot(s.id)
                            setErrors((x) => ({ ...x, slot: undefined }))
                          }}
                        />
                        {t(`checkout.windows.${s.window}`)}
                      </label>
                    ))}
                  </div>
                )
              })}
            </fieldset>
            {errors.slot && (
              <p id="slot-error" className={styles.errorText} role="alert">
                {errors.slot}
              </p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="pay-title">
            <h2 id="pay-title" className={styles.panelTitle}>
              <Banknote size={20} strokeWidth={2} aria-hidden="true" />
              {t('checkout.paymentTitle')}
            </h2>
            <label className={clsx(styles.payOption, styles.slotOn)}>
              <input type="radio" name="payment" checked readOnly />
              <span>
                <strong>{t('checkout.payOnDelivery')}</strong>
                {t('checkout.payOnDeliveryBody')}
              </span>
            </label>
            <Field label={t('checkout.noteLabel')} hint={t('checkout.noteHint')} optionalLabel="(optional)">
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </section>
        </div>

        <OrderSummary totals={totals}>
          {status === 'error' && (
            <p className={styles.errorText} role="alert">
              {serverError ? t(`checkout.serverErrors.${serverError}`) : t('checkout.errors.generic')}
            </p>
          )}
          <Button type="submit" variant="action" className={styles.full} disabled={status === 'placing'}>
            {status === 'placing' ? t('checkout.placing') : t('checkout.place')}
          </Button>
          <p className={styles.agree}>
            <Trans t={t} i18nKey="checkout.agree" components={{ terms: <Link to="/terms" /> }} />
          </p>
        </OrderSummary>
      </form>
    </div>
  )
}

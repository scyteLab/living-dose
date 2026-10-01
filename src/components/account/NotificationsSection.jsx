import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import { hasChannel, loadNotifications, saveNotifications } from '@/lib/account/settings'
import styles from './Account.module.css'

function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <label className={styles.toggle}>
      <span className={styles.toggleText}>
        <strong>{label}</strong>
        {hint && <span className={styles.small}>{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </label>
  )
}

export default function NotificationsSection({ user }) {
  const { t } = useTranslation('account')
  const [n, setN] = useState(() => loadNotifications(user.id))
  const [status, setStatus] = useState('idle')
  const set = (patch) => {
    setN((x) => ({ ...x, ...patch }))
    setStatus('idle')
  }
  const channelOk = hasChannel(n)

  return (
    <form
      className={styles.section}
      onSubmit={(e) => {
        e.preventDefault()
        if (!channelOk) return
        saveNotifications(user.id, n)
        setStatus('saved')
      }}
      noValidate
    >
      <div>
        <h2 className={styles.sectionTitle}>{t('notifications.title')}</h2>
        <p className={styles.muted}>{t('notifications.intro')}</p>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t('notifications.what')}</legend>
        <Toggle label={t('notifications.meals')} hint={t('notifications.mealsHint')} checked={n.meals} onChange={(meals) => set({ meals })} />
        {n.meals && (
          <div className={styles.times}>
            {['breakfast', 'lunch', 'dinner'].map((slot) => (
              <label key={slot} className={styles.time}>
                <span>{t(`notifications.slots.${slot}`)}</span>
                <input type="time" value={n.mealTimes[slot]} onChange={(e) => set({ mealTimes: { ...n.mealTimes, [slot]: e.target.value } })} />
              </label>
            ))}
          </div>
        )}
        <Toggle label={t('notifications.water')} hint={t('notifications.waterHint')} checked={n.water} onChange={(water) => set({ water })} />
        <Toggle label={t('notifications.consultations')} hint={t('notifications.consultationsHint')} checked disabled onChange={() => {}} />
        <Toggle label={t('notifications.checkIn')} checked={n.checkIn} onChange={(checkIn) => set({ checkIn })} />
        <Toggle label={t('notifications.orders')} checked={n.orders} onChange={(orders) => set({ orders })} />
        <Toggle label={t('notifications.news')} checked={n.news} onChange={(news) => set({ news })} />
      </fieldset>

      <fieldset className={styles.fieldset} aria-describedby={channelOk ? undefined : 'channel-error'}>
        <legend className={styles.label}>{t('notifications.how')}</legend>
        {Object.keys(n.channels).map((c) => (
          <Toggle key={c} label={t(`notifications.channels.${c}`)} checked={n.channels[c]} onChange={(v) => set({ channels: { ...n.channels, [c]: v } })} />
        ))}
        {!channelOk && (
          <p id="channel-error" className={styles.error} role="alert">
            {t('notifications.channelError')}
          </p>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t('notifications.quiet')}</legend>
        <p className={styles.small}>{t('notifications.quietHint')}</p>
        <div className={styles.times}>
          <label className={styles.time}>
            <span>{t('notifications.from')}</span>
            <input type="time" value={n.quietStart} onChange={(e) => set({ quietStart: e.target.value })} />
          </label>
          <label className={styles.time}>
            <span>{t('notifications.to')}</span>
            <input type="time" value={n.quietEnd} onChange={(e) => set({ quietEnd: e.target.value })} />
          </label>
        </div>
      </fieldset>

      <p className={styles.note}>{t('notifications.serverNote')}</p>
      <div className={styles.actions}>
        <Button type="submit" disabled={!channelOk}>
          {t('save')}
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

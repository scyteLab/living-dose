import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Copy, HeartHandshake, MessageCircle } from 'lucide-react'
import fam from '@/components/family/Family.module.css'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import { createInvite, inviteLink, listLinks, removeLink } from '@/lib/family/family'
import styles from './Account.module.css'
import { formatLocale } from '@/i18n'

/** Account → Family helpers: invite someone to look after you, and see who can. */
export default function FamilySection({ user }) {
  const { t, i18n } = useTranslation('family')
  const { firstName } = useAuth()
  const [links, setLinks] = useState({ helpers: [], helping: [] })
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('idle') // idle | creating | copied | error

  const load = useCallback(() => {
    listLinks(user.id)
      .then(setLinks)
      .catch(() => {})
  }, [user.id])
  useEffect(() => load(), [load])

  const fmt = new Intl.DateTimeFormat(formatLocale(i18n.language), { day: 'numeric', month: 'short', year: 'numeric' })
  const link = invite ? inviteLink(invite) : null

  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.sectionTitle}>{t('account.title')}</h2>
        <p className={styles.muted}>{t('account.intro')}</p>
      </div>

      <div className={styles.card}>
        {link ? (
          <div className={fam.linkBox}>
            <p className={styles.small}>{t('account.linkReady')}</p>
            <p className={fam.linkText}>{link}</p>
            <div className={fam.actions}>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link)
                    setStatus('copied')
                  } catch {
                    /* the link is on screen to copy by hand */
                  }
                }}
              >
                <Copy size={16} strokeWidth={2} aria-hidden="true" />
                {status === 'copied' ? t('account.copied') : t('account.copy')}
              </Button>
              <a
                className={fam.callBtn}
                href={`https://wa.me/?text=${encodeURIComponent(t('account.whatsappText', { link }))}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} strokeWidth={2.2} aria-hidden="true" />
                {t('account.whatsapp')}
              </a>
            </div>
          </div>
        ) : (
          <Button
            className={styles.selfStart}
            disabled={status === 'creating'}
            onClick={async () => {
              setStatus('creating')
              try {
                setInvite(await createInvite(user, firstName || user.email?.split('@')[0]))
                setStatus('idle')
              } catch {
                setStatus('error')
              }
            }}
          >
            <HeartHandshake size={18} strokeWidth={2} aria-hidden="true" />
            {status === 'creating' ? t('account.creating') : t('account.invite')}
          </Button>
        )}
        {status === 'error' && (
          <p className={styles.error} role="alert">
            {t('account.error')}
          </p>
        )}
      </div>

      <div className={styles.card}>
        <p className={styles.label}>{t('account.helpersTitle')}</p>
        {links.helpers.length === 0 ? (
          <p className={styles.small}>{t('account.noHelpers')}</p>
        ) : (
          <ul className={fam.people}>
            {links.helpers.map((l) => (
              <li key={l.helperId}>
                <span>
                  <strong>{l.helperName}</strong> <span className={styles.small}>{t('account.since', { date: fmt.format(new Date(l.createdAt)) })}</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => removeLink(l.ownerId, l.helperId).then(load, load)}>
                  {t('account.remove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {links.helping.length > 0 && (
        <div className={styles.card}>
          <p className={styles.label}>{t('account.helpingTitle')}</p>
          <ul className={fam.people}>
            {links.helping.map((l) => (
              <li key={l.ownerId}>
                <strong>{l.ownerName}</strong>
                <Link to="/family">{t('account.seeFamily')}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

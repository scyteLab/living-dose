import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Download, Trash2, UserX } from 'lucide-react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { site } from '@/config/site'
import { buildExport, deleteLocalData, downloadJson } from '@/lib/account/data'
import { syncApi } from '@/lib/sync/remote'
import { isSupabaseConfigured } from '@/lib/supabase'
import styles from './Account.module.css'

export default function PrivacySection({ user }) {
  const { t, i18n } = useTranslation('account')
  const meta = user.user_metadata ?? {}
  const [notice, setNotice] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const fmt = (iso) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  const today = new Date().toISOString().slice(0, 10)
  const mailto = `mailto:${site.privacyEmail}?subject=${encodeURIComponent(t('privacy.accountSubject'))}&body=${encodeURIComponent(`Account ID: ${user.id}`)}`

  return (
    <section className={styles.section} aria-labelledby="privacy-h">
      <div>
        <h2 id="privacy-h" className={styles.sectionTitle}>
          {t('privacy.title')}
        </h2>
        <p className={styles.muted}>{t('privacy.intro')}</p>
      </div>
      {notice && (
        <p className={styles.saved} role="status">
          {notice}
        </p>
      )}

      <div className={styles.card}>
        <p className={styles.label}>{t('privacy.consents')}</p>
        <ul className={styles.consents}>
          <li>
            <CheckCircle2 size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>
              {t('privacy.termsAgreed')}
              <small>{meta.consent_terms_at ? t('privacy.agreedOn', { date: fmt(meta.consent_terms_at) }) : t('privacy.notRecorded')}</small>
            </span>
          </li>
          <li>
            <CheckCircle2 size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>
              {t('privacy.healthAgreed')}
              <small>{meta.consent_health_at ? t('privacy.agreedOn', { date: fmt(meta.consent_health_at) }) : t('privacy.notRecorded')}</small>
              <small>{t('privacy.healthHint')}</small>
            </span>
          </li>
        </ul>
        <p className={styles.small}>
          <Link to="/privacy">{t('privacy.policies')}</Link>
        </p>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <Download size={18} strokeWidth={2} aria-hidden="true" />
          {t('privacy.download')}
        </p>
        <p className={styles.small}>{t('privacy.downloadBody')}</p>
        {isSupabaseConfigured && <p className={styles.small}>{t('privacy.syncNote')}</p>}
        <Button
          variant="outline"
          size="sm"
          className={styles.selfStart}
          onClick={() => {
            downloadJson(`living-dose-my-data-${today}.json`, buildExport(user))
            setNotice(t('privacy.downloaded'))
          }}
        >
          {t('privacy.downloadButton')}
        </Button>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          {t('privacy.deleteLocal')}
        </p>
        <p className={styles.small}>{isSupabaseConfigured ? t('privacy.deleteLocalBodySynced') : t('privacy.deleteLocalBody')}</p>
        <Button variant="outline" size="sm" className={`${styles.selfStart} ${styles.danger}`} onClick={() => setConfirming(true)}>
          {t('privacy.deleteLocalButton')}
        </Button>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <UserX size={18} strokeWidth={2} aria-hidden="true" />
          {t('privacy.account')}
        </p>
        <p className={styles.small}>{t('privacy.accountBody')}</p>
        <a href={mailto} className={styles.textLink}>
          {t('privacy.accountButton')}
        </a>
      </div>

      <Dialog
        open={confirming}
        onClose={() => {
          setConfirming(false)
          setTyped('')
        }}
        title={t('privacy.deleteTitle')}
        description={t('privacy.deleteBody')}
        closeLabel={t('cancel')}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </Button>
            <Button
              className={styles.dangerSolid}
              disabled={typed.trim().toUpperCase() !== 'DELETE'}
              onClick={async () => {
                // With sync on, remove the synced copy too, or it would come straight back
                if (isSupabaseConfigured) await syncApi(user.id).removeAll().catch(() => {})
                const count = deleteLocalData(user.id)
                setConfirming(false)
                setTyped('')
                setNotice(t('privacy.deleted', { count }))
              }}
            >
              {t('privacy.deleteConfirm')}
            </Button>
          </>
        }
      >
        <label className={styles.typeConfirm}>
          <span>{t('privacy.deleteType')}</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
        </label>
      </Dialog>
    </section>
  )
}

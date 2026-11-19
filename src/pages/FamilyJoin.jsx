import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeartHandshake } from 'lucide-react'
import styles from '@/components/family/Family.module.css'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { acceptInvite, previewInvite } from '@/lib/family/family'

/** /family/join/:code: accept an invite to look after a family member. */
export default function FamilyJoin() {
  const { t } = useTranslation('family')
  useDocumentTitle(t('join.docTitle'))
  const { code } = useParams()
  const { user, firstName } = useAuth()
  const [invite, setInvite] = useState(undefined) // undefined loading, null not found
  const [state, setState] = useState({ status: 'idle' })

  useEffect(() => {
    let alive = true
    previewInvite(code, user.id)
      .then((inv) => alive && setInvite(inv))
      .catch(() => alive && setState({ status: 'error', kind: 'setup' }))
    return () => {
      alive = false
    }
  }, [code, user.id])

  const accept = async () => {
    setState({ status: 'saving' })
    try {
      const name = await acceptInvite(code, user, firstName)
      setState({ status: 'done', name })
    } catch (err) {
      setState({ status: 'error', kind: err.kind ?? 'setup' })
    }
  }

  if (invite === undefined && state.status !== 'error') return <div className={styles.page} role="status" />
  const name = state.name ?? invite?.ownerName ?? ''
  const problem = state.status === 'error' ? state.kind : !invite ? 'notFound' : invite.status !== 'ok' ? invite.status : null

  return (
    <div className={styles.page}>
      <section className={styles.joinCard}>
        <span className={styles.joinIcon} aria-hidden="true">
          <HeartHandshake size={32} strokeWidth={2} />
        </span>
        {state.status === 'done' ? (
          <>
            <h1 className={styles.title}>{t('join.done', { name })}</h1>
            <Button to="/family" size="lg">
              {t('join.goFamily', { name })}
            </Button>
          </>
        ) : problem ? (
          <>
            <p className={styles.error} role="alert">
              {t(`join.${problem}`)}
            </p>
            <Button to="/" variant="outline">
              {t('dashboard.title')}
            </Button>
          </>
        ) : (
          <>
            <h1 className={styles.title}>{t('join.title', { name })}</h1>
            <p className={styles.muted}>{t('join.body', { name })}</p>
            {invite.demoSelf && <p className={styles.small}>{t('join.demoSelf')}</p>}
            <div className={styles.actions}>
              <Button size="lg" onClick={accept} disabled={state.status === 'saving'}>
                {t('join.accept', { name })}
              </Button>
              <Button to="/" variant="outline" size="lg">
                {t('join.decline')}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

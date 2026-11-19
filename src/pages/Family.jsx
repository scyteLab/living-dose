import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PersonCard from '@/components/family/PersonCard'
import styles from '@/components/family/Family.module.css'
import PushCard from '@/components/push/PushCard'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useFamilyPhones from '@/hooks/useFamilyPhones'
import { familyOverview, removeLink } from '@/lib/family/family'

const ORDER = { urgent: 0, unwell: 1, quiet: 2, notYet: 3, ok: 4 }

/** /family: the people this member looks after, with today's status first. */
export default function Family() {
  const { t } = useTranslation('family')
  useDocumentTitle(t('docTitle'))
  const { user } = useAuth()
  const [people, setPeople] = useState(null)
  const [error, setError] = useState(false)
  const [phones, savePhone] = useFamilyPhones(user.id)

  const load = useCallback(() => {
    familyOverview(user.id)
      .then((list) => {
        setPeople([...list].sort((a, b) => ORDER[a.status] - ORDER[b.status]))
        setError(false)
      })
      .catch(() => setError(true))
  }, [user.id])

  useEffect(() => {
    load()
    // Refresh every 5 minutes while the page is open
    const id = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>

      {error && <p className={styles.error}>{t('loadError')}</p>}
      {people === null && !error && <div role="status" aria-label={t('title')} />}

      {people?.length === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.name}>{t('empty.title')}</h2>
          <p className={styles.muted}>{t('empty.body')}</p>
          <p className={styles.small}>{t('empty.own')}</p>
          <Button to="/account/family" variant="outline" size="sm">
            {t('account.title')}
          </Button>
        </div>
      )}

      {people?.length > 0 && <PushCard userId={user.id} why="family" name={people[0].ownerName} compact />}

      {people?.length > 0 && (
        <ul className={styles.list}>
          {people.map((p) => (
            <PersonCard
              key={p.ownerId}
              person={p}
              phone={phones[p.ownerId]}
              onSavePhone={(phone) => savePhone(p.ownerId, phone)}
              onStop={async () => {
                await removeLink(p.ownerId, user.id).catch(() => {})
                load()
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

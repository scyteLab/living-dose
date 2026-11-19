import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleAlert, CircleCheck, Clock, Thermometer } from 'lucide-react'
import clsx from 'clsx'
import { familyOverview } from '@/lib/family/family'
import styles from './Family.module.css'

const ICON = { urgent: CircleAlert, unwell: Thermometer, ok: CircleCheck, notYet: Clock, quiet: Clock }
const ORDER = { urgent: 0, unwell: 1, quiet: 2, notYet: 3, ok: 4 }

/** Dashboard: one line per person the member looks after. Hidden when there's no one. */
export default function FamilyStrip({ userId }) {
  const { t } = useTranslation('family')
  const [people, setPeople] = useState([])

  useEffect(() => {
    let alive = true
    familyOverview(userId)
      .then((list) => alive && setPeople([...list].sort((a, b) => ORDER[a.status] - ORDER[b.status])))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [userId])

  if (people.length === 0) return null
  return (
    <section className={styles.strip} aria-label={t('dashboard.title')}>
      <div className={styles.stripHead}>
        <span>{t('dashboard.title')}</span>
        <Link to="/family">{t('dashboard.more')}</Link>
      </div>
      {people.slice(0, 3).map((p) => {
        const Icon = ICON[p.status]
        const text =
          p.status === 'quiet'
            ? p.daysSince === null
              ? t('status.quietNever', { name: p.ownerName })
              : t('status.quiet', { name: p.ownerName, count: p.daysSince })
            : t(`status.${p.status}`, { name: p.ownerName })
        return (
          <Link key={p.ownerId} to="/family" className={clsx(styles.stripRow, styles[`s_${p.status}`])}>
            <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
            {text}
          </Link>
        )
      })}
    </section>
  )
}

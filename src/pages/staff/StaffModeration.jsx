import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { timeAgo } from '@/lib/community/store'
import { staffReports, staffResolveReport } from '@/lib/staff/service'

export default function StaffModeration() {
  const { t, i18n } = useTranslation('staff')
  const tc = useTranslation('community').t
  useDocumentTitle(t('moderation.title'))
  const { data, refresh, staff } = useStaffData(staffReports)
  const reports = data ?? []
  const decide = async (r, decision) => {
    try {
      await staffResolveReport(r, decision, staff)
    } finally {
      refresh()
    }
  }
  const [tab, setTab] = useState('open')

  // One card per reported item, with every reason given
  const byItem = new Map()
  for (const r of reports) {
    const resolved = r.status !== 'open'
    if ((tab === 'open') === resolved) continue
    const entry = byItem.get(r.itemId) ?? { ...r, reasons: [], count: 0 }
    entry.reasons = [...new Set([...entry.reasons, r.reason])]
    entry.count++
    byItem.set(r.itemId, entry)
  }
  const items = [...byItem.values()]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('moderation.title')}</h1>
      <p className={styles.guide}>
        <ShieldAlert size={18} strokeWidth={2} aria-hidden="true" />
        {t('moderation.guide')}
      </p>
      <div className={styles.filters} role="tablist">
        {['open', 'resolved'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx(styles.filter, tab === id && styles.filterOn)} onClick={() => setTab(id)}>
            {t(`moderation.${id}`)}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{t('moderation.empty')}</p>
      ) : (
        <ul className={styles.reports}>
          {items.map((r) => (
            <li key={r.itemId} className={styles.report}>
              <div className={styles.reportHead}>
                <Tag tone="berry">{t('moderation.reports', { count: r.count })}</Tag>
                <span className={styles.small}>
                  {t(`moderation.kind.${r.kind}`)} {r.group && t('moderation.in', { group: tc(`groups.${r.group}.name`) })} · {timeAgo(r.createdAt, i18n.language)}
                </span>
              </div>
              <blockquote className={styles.quote}>{r.body}</blockquote>
              <ul className={styles.reasons}>
                {r.reasons.map((reason) => (
                  <li key={reason}>{t(`moderation.reasons.${reason}`)}</li>
                ))}
              </ul>
              <div className={styles.reportActions}>
                {tab === 'open' ? (
                  <>
                    <Button
                      size="sm"
                      className={styles.removeButton}
                      onClick={() => {
                        if (!window.confirm(t('moderation.removeConfirm'))) return
                        decide(r, 'remove')
                      }}
                    >
                      {t('moderation.remove')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        decide(r, 'keep')
                      }}
                    >
                      {t('moderation.keep')}
                    </Button>
                  </>
                ) : (
                  <Tag tone={r.status === 'removed' ? 'berry' : 'leaf'}>{t(`moderation.${r.status}`)}</Tag>
                )}
                {r.postId && (
                  <Link to={`/community/posts/${r.postId}`} className={styles.rowLink}>
                    {t('moderation.view')}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

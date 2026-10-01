import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Plus, Users } from 'lucide-react'
import clsx from 'clsx'
import Composer from '@/components/community/Composer'
import { GROUP_ICON } from '@/components/community/groupIcons'
import PostCard from '@/components/community/PostCard'
import useReport from '@/components/community/useReport'
import styles from '@/components/community/Community.module.css'
import PageIntro from '@/components/page/PageIntro'
import { GROUPS_BY_ID } from '@/data/community'
import useAuth from '@/hooks/useAuth'
import useCommunity from '@/hooks/useCommunity'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function GroupPage() {
  const { groupId } = useParams()
  const { t } = useTranslation('community')
  const g = GROUPS_BY_ID[groupId]
  useDocumentTitle(g ? t(`groups.${g.id}.name`) : t('docTitle'))
  const { user } = useAuth()
  const c = useCommunity(user)
  const [notice, setNotice] = useState(null)
  const report = useReport((id, reason) => {
    c.report(id, reason)
    setNotice(t('report.done'))
  })

  if (!g) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('groupNotFound')}>
          <Link to="/community?tab=groups">{t('backToCommunity')}</Link>
        </PageIntro>
      </div>
    )
  }

  const Icon = GROUP_ICON[g.topic]
  const name = t(`groups.${g.id}.name`)
  const joined = c.joined.includes(g.id)
  const posts = c.feed.filter((p) => p.group === g.id)

  return (
    <div className={styles.page}>
      <Link to="/community?tab=groups" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('backToCommunity')}
      </Link>
      <header className={styles.groupHead}>
        <span className={clsx(styles.groupIcon, styles.groupIconLg, styles[`group_${g.topic}`])} aria-hidden="true">
          <Icon size={32} strokeWidth={1.8} />
        </span>
        <div className={styles.groupHeadText}>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.intro}>{t(`groups.${g.id}.desc`)}</p>
          <p className={styles.groupMeta}>
            <Users size={15} strokeWidth={2} aria-hidden="true" />
            {t('members', { count: (g.members + (joined ? 1 : 0)).toLocaleString() })}
            {g.anonymous && <span> · {t('anonymousGroup')}</span>}
          </p>
        </div>
        {user && (
          <button type="button" aria-pressed={joined} className={clsx(styles.joinButton, joined && styles.joinedButton)} onClick={() => c.toggleJoined(g.id)}>
            {joined ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : <Plus size={16} strokeWidth={2.4} aria-hidden="true" />}
            {joined ? t('joined') : t('join')}
          </button>
        )}
      </header>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <div className={styles.feed}>
        <Composer group={g.id} onSubmit={(p) => c.post(p)} />
        {posts.length === 0 ? (
          <p className={styles.empty}>{t('noPosts')}</p>
        ) : (
          <ul className={styles.posts}>
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} onHelpful={c.toggleHelpful} onReport={report.open} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {report.dialog}
    </div>
  )
}

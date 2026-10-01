import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Flag } from 'lucide-react'
import Composer from '@/components/community/Composer'
import PostCard, { Author } from '@/components/community/PostCard'
import useReport from '@/components/community/useReport'
import styles from '@/components/community/Community.module.css'
import PageIntro from '@/components/page/PageIntro'
import { GROUPS_BY_ID } from '@/data/community'
import useAuth from '@/hooks/useAuth'
import useCommunity from '@/hooks/useCommunity'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function PostPage() {
  const { postId } = useParams()
  const { t } = useTranslation('community')
  useDocumentTitle(t('docTitle'))
  const { user } = useAuth()
  const c = useCommunity(user)
  const [notice, setNotice] = useState(null)
  const report = useReport((id, reason) => {
    c.report(id, reason)
    setNotice(t('report.done'))
  })
  const post = c.feed.find((p) => p.id === postId)

  if (!post) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('post.notFound')}>
          <Link to="/community">{t('backToCommunity')}</Link>
        </PageIntro>
      </div>
    )
  }

  const anonymousGroup = GROUPS_BY_ID[post.group]?.anonymous

  return (
    <div className={styles.page}>
      <Link to={`/community/groups/${post.group}`} className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t(`groups.${post.group}.name`)}
      </Link>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <div className={styles.thread}>
        <PostCard post={post} onHelpful={c.toggleHelpful} onReport={report.open} full />
        <section aria-labelledby="replies-h" className={styles.replies}>
          <h2 id="replies-h" className={styles.sideTitle}>
            {t('post.replies', { count: post.replies.length })}
          </h2>
          <ul>
            {post.replies.map((r) => (
              <li key={r.id} className={r.professionalId ? styles.replyPro : styles.reply}>
                <Author item={r} />
                <p className={styles.bodyFull}>{r.body}</p>
                {!r.mine && !r.professionalId && (
                  <button type="button" className={styles.replyReport} onClick={() => report.open(r.id)}>
                    <Flag size={14} strokeWidth={2} aria-hidden="true" />
                    {t('post.report')}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <Composer mode="reply" group={post.group} onSubmit={({ body, anonymous }) => c.reply(post.id, { body, anonymous: anonymous || anonymousGroup })} />
        </section>
      </div>
      {report.dialog}
    </div>
  )
}

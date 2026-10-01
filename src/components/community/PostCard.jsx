import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Flag, Heart, MessageCircle, UserRound } from 'lucide-react'
import clsx from 'clsx'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import { timeAgo } from '@/lib/community/store'
import styles from './Community.module.css'

/** Who wrote it: a member, an anonymous member, you, or a verified professional. */
export function Author({ item, when }) {
  const { t, i18n } = useTranslation('community')
  const pro = item.professionalId ? PROFESSIONALS_BY_ID[item.professionalId] : null
  const name = pro ? pro.name : item.author ? (item.mine ? `${item.author} (${t('post.you')})` : item.author) : item.mine ? `${t('post.anonymous')} (${t('post.you')})` : t('post.anonymous')
  const initial = pro ? pro.name.replace(/^Dr\s+/, '')[0] : item.author?.[0]
  return (
    <div className={styles.author}>
      <span className={clsx(styles.avatar, pro && styles.avatarPro, !item.author && !pro && styles.avatarAnon)} aria-hidden="true">
        {initial ?? <UserRound size={18} strokeWidth={2} />}
      </span>
      <div className={styles.authorText}>
        <span className={styles.authorName}>
          {name}
          {pro && (
            <span className={styles.proBadge}>
              <BadgeCheck size={14} strokeWidth={2.4} aria-hidden="true" />
              {t('post.professional')} · {pro.title}
            </span>
          )}
        </span>
        <span className={styles.authorMeta}>
          {when}
          {item.createdAt && <> · {timeAgo(item.createdAt, i18n.language)}</>}
        </span>
      </div>
    </div>
  )
}

export default function PostCard({ post, onHelpful, onReport, full = false }) {
  const { t } = useTranslation('community')
  const groupName = t(`groups.${post.group}.name`)

  return (
    <article className={styles.post}>
      <Author item={post} when={<Link to={`/community/groups/${post.group}`}>{t('post.in', { group: groupName })}</Link>} />
      <p className={full ? styles.bodyFull : styles.body}>{post.body}</p>
      <div className={styles.postActions}>
        <button type="button" aria-pressed={post.helpfulByMe} className={clsx(styles.actionButton, post.helpfulByMe && styles.helpfulOn)} onClick={() => onHelpful(post.id)}>
          <Heart size={17} strokeWidth={2} aria-hidden="true" />
          {t('post.helpful')}
          {post.helpfulCount > 0 && <span className={styles.count}>{post.helpfulCount}</span>}
        </button>
        {!full && (
          <Link to={`/community/posts/${post.id}`} className={styles.actionButton}>
            <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
            {post.replies.length ? t('post.replies', { count: post.replies.length }) : t('post.noReplies')}
          </Link>
        )}
        {!post.mine && (
          <button type="button" className={clsx(styles.actionButton, styles.report)} onClick={() => onReport(post.id)}>
            <Flag size={16} strokeWidth={2} aria-hidden="true" />
            {t('post.report')}
          </button>
        )}
      </div>
    </article>
  )
}

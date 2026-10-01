import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Plus, Users } from 'lucide-react'
import clsx from 'clsx'
import { GROUP_ICON } from './groupIcons'
import styles from './Community.module.css'

export default function GroupCard({ group, joined, onToggle, canJoin }) {
  const { t } = useTranslation('community')
  const Icon = GROUP_ICON[group.topic]
  const name = t(`groups.${group.id}.name`)
  return (
    <article className={styles.groupCard}>
      <span className={clsx(styles.groupIcon, styles[`group_${group.topic}`])} aria-hidden="true">
        <Icon size={24} strokeWidth={1.8} />
      </span>
      <div className={styles.groupText}>
        <h3 className={styles.groupName}>
          <Link to={`/community/groups/${group.id}`}>{name}</Link>
        </h3>
        <p className={styles.small}>{t(`groups.${group.id}.desc`)}</p>
        <p className={styles.groupMeta}>
          <Users size={14} strokeWidth={2} aria-hidden="true" />
          {t('members', { count: group.members.toLocaleString() })}
          {group.anonymous && <span> · {t('anonymousGroup')}</span>}
        </p>
      </div>
      {canJoin && (
        <button type="button" aria-pressed={joined} aria-label={joined ? t('leaveAria', { name }) : t('joinAria', { name })} className={clsx(styles.joinButton, joined && styles.joinedButton)} onClick={() => onToggle(group.id)}>
          {joined ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : <Plus size={16} strokeWidth={2.4} aria-hidden="true" />}
          {joined ? t('joined') : t('join')}
        </button>
      )}
    </article>
  )
}

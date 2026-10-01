import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import ChallengeCard from '@/components/community/ChallengeCard'
import Composer from '@/components/community/Composer'
import GroupCard from '@/components/community/GroupCard'
import PostCard from '@/components/community/PostCard'
import useReport from '@/components/community/useReport'
import styles from '@/components/community/Community.module.css'
import { CHALLENGES, GROUPS } from '@/data/community'
import useAuth from '@/hooks/useAuth'
import useCommunity from '@/hooks/useCommunity'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { isDemo } from '@/lib/auth'
import { challengeProgress } from '@/lib/community/challenges'
import { loadHabits } from '@/lib/dashboard/habits'
import { loadPlanStore } from '@/lib/mealPlan/storage'

const TABS = ['feed', 'groups', 'challenges']

export default function CommunityPage() {
  const { t } = useTranslation('community')
  useDocumentTitle(t('docTitle'), t('metaDescription'))
  const { user } = useAuth()
  const c = useCommunity(user)
  const [params, setParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const report = useReport((id, reason) => {
    c.report(id, reason)
    setNotice(t('report.done'))
  })
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'feed'
  const [onlyJoined, setOnlyJoined] = useState(false)
  const [tracked] = useState(() => (user ? { habits: loadHabits(user.id), planStore: loadPlanStore(user.id) } : null))

  const posts = onlyJoined ? c.feed.filter((p) => c.joined.includes(p.group)) : c.feed

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.intro}>{t('intro')}</p>
        <p className={styles.guidelines}>
          <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
          <span>
            {t('guidelinesShort')} <Link to="/community/guidelines">{t('guidelinesLink')}</Link>
          </span>
        </p>
        {isDemo && <p className={styles.small}>{t('demoNote')}</p>}
      </header>

      <div className={styles.tabs} role="tablist" aria-label={t('tabs.label')}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={clsx(styles.tab, tab === id && styles.tabOn)}
            onClick={() => setParams(id === 'feed' ? {} : { tab: id }, { replace: true })}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {tab === 'feed' && (
        <div className={styles.feedLayout} role="tabpanel">
          <div className={styles.feed}>
            <Composer onSubmit={(p) => c.post(p)} />
            {user && c.joined.length > 0 && (
              <div className={styles.filter} role="group" aria-label={t('filterLabel')}>
                <button type="button" aria-pressed={!onlyJoined} className={clsx(styles.chip, !onlyJoined && styles.chipOn)} onClick={() => setOnlyJoined(false)}>
                  {t('filterAll')}
                </button>
                <button type="button" aria-pressed={onlyJoined} className={clsx(styles.chip, onlyJoined && styles.chipOn)} onClick={() => setOnlyJoined(true)}>
                  {t('filterJoined')}
                </button>
              </div>
            )}
            <ul className={styles.posts}>
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} onHelpful={c.toggleHelpful} onReport={report.open} />
                </li>
              ))}
            </ul>
          </div>
          <aside className={styles.side}>
            <p className={styles.sideTitle}>{t('tabs.groups')}</p>
            <ul className={styles.sideGroups}>
              {GROUPS.slice(0, 5).map((g) => (
                <li key={g.id}>
                  <Link to={`/community/groups/${g.id}`}>{t(`groups.${g.id}.name`)}</Link>
                  <span className={styles.small}>{t('members', { count: g.members.toLocaleString() })}</span>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.linkButton} onClick={() => setParams({ tab: 'groups' }, { replace: true })}>
              {t('allGroups')}
            </button>
          </aside>
        </div>
      )}

      {tab === 'groups' && (
        <ul className={styles.groupGrid} role="tabpanel">
          {GROUPS.map((g) => (
            <li key={g.id}>
              <GroupCard group={g} joined={c.joined.includes(g.id)} onToggle={c.toggleJoined} canJoin={Boolean(user)} />
            </li>
          ))}
        </ul>
      )}

      {tab === 'challenges' && (
        <div role="tabpanel" className={styles.challengesPanel}>
          <p className={styles.muted}>{t('challenges.intro')}</p>
          <ul className={styles.challengeGrid}>
            {CHALLENGES.map((ch) => (
              <li key={ch.id}>
                <ChallengeCard
                  challenge={ch}
                  joined={c.challenges.includes(ch.id)}
                  progress={tracked ? challengeProgress(ch, tracked) : null}
                  onToggle={c.toggleChallenge}
                  signedIn={Boolean(user)}
                />
              </li>
            ))}
          </ul>
          <p className={styles.small}>{t('challenges.howTo')}</p>
        </div>
      )}
      {report.dialog}
    </div>
  )
}

/**
 * Community activity kept on this device for now: posts and replies you write,
 * groups you've joined, posts you found helpful or reported, challenges you joined.
 * supabase/migrations/0005_community.sql has the tables for sharing with others.
 */
import { SEED_POSTS } from '@/data/community'

const KEY = (userId) => `ld.community.${userId}`
const EMPTY = { posts: [], replies: {}, joined: [], helpful: [], reported: [], challenges: [] }

export function loadCommunity(userId) {
  try {
    return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(KEY(userId))) }
  } catch {
    return EMPTY
  }
}

export function saveCommunity(userId, data) {
  try {
    window.localStorage.setItem(KEY(userId), JSON.stringify(data))
  } catch {
    /* storage full or blocked */
  }
}

const ago = (now, minutes) => new Date(now - minutes * 60000).toISOString()

/** Sample posts plus the member's own, newest first, with their replies and counts. */
export function buildFeed(data, now = Date.now(), hidden = []) {
  const seeds = SEED_POSTS.map((p) => ({
    ...p,
    createdAt: ago(now, p.minutesAgo),
    replies: p.replies.map((r) => ({ ...r, createdAt: ago(now, r.minutesAgo) })),
    seed: true,
  }))
  return [...data.posts, ...seeds]
    .filter((p) => !data.reported.includes(p.id) && !hidden.includes(p.id))
    .map((p) => {
      const extra = data.replies[p.id] ?? []
      const replies = [...(p.replies ?? []), ...extra].filter((r) => !data.reported.includes(r.id) && !hidden.includes(r.id))
      const mine = data.helpful.includes(p.id)
      return { ...p, replies, helpfulCount: (p.helpful ?? 0) + (mine ? 1 : 0), helpfulByMe: mine }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

let counter = 0
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

/** "5 minutes ago", "yesterday" and so on. */
export function timeAgo(iso, locale = 'en', now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const s = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(s)
  if (abs < 60) return rtf.format(0, 'second')
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (abs < 604800) return rtf.format(Math.round(s / 86400), 'day')
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso))
}

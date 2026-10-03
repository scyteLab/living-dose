import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPost, createReply, fetchFeed, reportItem, toggleHelpful as toggleHelpfulRemote } from '@/lib/community/remote'
import { buildFeed, loadCommunity, newId, saveCommunity } from '@/lib/community/store'
import { fileReport, hiddenItems } from '@/lib/staff/api'
import { isSupabaseConfigured } from '@/lib/supabase'

const remote = isSupabaseConfigured

/**
 * Feed, groups and challenges. With Supabase configured the feed is shared by
 * everyone (lib/community/remote.js); in demo mode it's on this device.
 * Joined groups and challenges are personal choices kept on the device.
 */
export default function useCommunity(user) {
  const userId = user?.id ?? 'guest'
  const authorName = user?.user_metadata?.first_name || null
  const [data, setData] = useState(() => loadCommunity(userId))
  const [now] = useState(() => Date.now())
  const [hidden] = useState(() => hiddenItems(window.localStorage))
  const [serverFeed, setServerFeed] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (user) saveCommunity(userId, data)
  }, [user, userId, data])

  // Server feed (signed-in members only; the views require it)
  useEffect(() => {
    if (!remote || !user) return
    let alive = true
    fetchFeed()
      .then((feed) => alive && setServerFeed(feed))
      .catch(() => alive && setServerFeed([]))
    return () => {
      alive = false
    }
  }, [user, version])
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const localFeed = useMemo(() => buildFeed(data, now, hidden), [data, now, hidden])
  const feed = remote && user ? (serverFeed ?? []) : localFeed

  const post = useCallback(
    async ({ group, body, anonymous }) => {
      if (remote) {
        await createPost({ group, body, anonymous })
        reload()
        return
      }
      const p = { id: newId('post'), group, author: anonymous ? null : authorName, mine: true, body: body.trim(), createdAt: new Date().toISOString(), helpful: 0, replies: [] }
      setData((d) => ({ ...d, posts: [p, ...d.posts] }))
    },
    [authorName, reload],
  )

  const reply = useCallback(
    async (postId, { body, anonymous }) => {
      if (remote) {
        await createReply(postId, { body, anonymous })
        reload()
        return
      }
      setData((d) => ({
        ...d,
        replies: { ...d.replies, [postId]: [...(d.replies[postId] ?? []), { id: newId('reply'), author: anonymous ? null : authorName, mine: true, body: body.trim(), createdAt: new Date().toISOString() }] },
      }))
    },
    [authorName, reload],
  )

  const toggle = (key) => (id) => setData((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }))

  const toggleHelpful = async (id) => {
    if (!remote) return toggle('helpful')(id)
    // Update straight away, then confirm with the server
    setServerFeed((f) => f?.map((p) => (p.id === id ? { ...p, helpfulByMe: !p.helpfulByMe, helpfulCount: p.helpfulCount + (p.helpfulByMe ? -1 : 1) } : p)))
    try {
      await toggleHelpfulRemote(id)
    } finally {
      reload()
    }
  }

  const report = async (id, reason = 'other') => {
    const post = feed.find((p) => p.id === id)
    const replyItem = post ? null : feed.flatMap((p) => p.replies.map((r) => ({ ...r, group: p.group, postId: p.id }))).find((r) => r.id === id)
    if (remote) {
      await reportItem(post ? 'post' : 'reply', id, reason)
      reload()
      return
    }
    // Demo: send it to this device's moderation queue with a copy of what was reported
    const item = post ?? replyItem
    if (item) fileReport(window.localStorage, { itemId: id, kind: post ? 'post' : 'reply', reason, body: item.body, group: item.group, postId: post ? id : replyItem.postId, reporterId: userId })
    setData((d) => ({ ...d, reported: [...new Set([...d.reported, id])] }))
  }

  return {
    feed,
    loading: remote && Boolean(user) && serverFeed === null,
    joined: data.joined,
    challenges: data.challenges,
    post,
    reply,
    toggleHelpful,
    toggleJoined: toggle('joined'),
    toggleChallenge: toggle('challenges'),
    report,
  }
}

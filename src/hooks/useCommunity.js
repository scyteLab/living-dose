import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildFeed, loadCommunity, newId, saveCommunity } from '@/lib/community/store'

/** Feed, groups and challenges for the signed-in member (read-only for guests). */
export default function useCommunity(user) {
  const userId = user?.id ?? 'guest'
  const authorName = user?.user_metadata?.first_name || null
  const [data, setData] = useState(() => loadCommunity(userId))
  const [now] = useState(() => Date.now())

  useEffect(() => {
    if (user) saveCommunity(userId, data)
  }, [user, userId, data])

  const feed = useMemo(() => buildFeed(data, now), [data, now])

  const post = useCallback(
    ({ group, body, anonymous }) => {
      const p = { id: newId('post'), group, author: anonymous ? null : authorName, mine: true, body: body.trim(), createdAt: new Date().toISOString(), helpful: 0, replies: [] }
      setData((d) => ({ ...d, posts: [p, ...d.posts] }))
      return p
    },
    [authorName],
  )

  const reply = useCallback(
    (postId, { body, anonymous }) =>
      setData((d) => ({
        ...d,
        replies: { ...d.replies, [postId]: [...(d.replies[postId] ?? []), { id: newId('reply'), author: anonymous ? null : authorName, mine: true, body: body.trim(), createdAt: new Date().toISOString() }] },
      })),
    [authorName],
  )

  const toggle = (key) => (id) => setData((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }))

  return {
    feed,
    joined: data.joined,
    challenges: data.challenges,
    post,
    reply,
    toggleHelpful: toggle('helpful'),
    toggleJoined: toggle('joined'),
    toggleChallenge: toggle('challenges'),
    report: (id) => setData((d) => ({ ...d, reported: [...new Set([...d.reported, id])] })),
  }
}

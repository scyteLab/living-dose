/**
 * Community on the server: reads through views that never include who wrote a
 * post, and writes through checked functions
 * (supabase/migrations/0010_community_professionals_organisations.sql).
 */
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'

export function postFromRow(row) {
  return {
    id: row.id,
    group: row.group_id,
    author: row.author_name ?? null,
    anonymous: Boolean(row.anonymous),
    mine: Boolean(row.mine),
    body: row.body,
    createdAt: row.created_at,
    helpfulCount: Number(row.helpful_count ?? 0),
    helpfulByMe: Boolean(row.helpful_by_me),
    replies: [],
  }
}

export function replyFromRow(row) {
  return { id: row.id, author: row.author_name ?? null, professionalId: row.professional_id ?? null, mine: Boolean(row.mine), body: row.body, createdAt: row.created_at }
}

export async function fetchFeed() {
  const [posts, replies] = await Promise.all([
    supabase.from('community_feed').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('community_feed_replies').select('*').order('created_at', { ascending: true }).limit(2000),
  ])
  const feed = unwrap(posts).map(postFromRow)
  const byId = Object.fromEntries(feed.map((p) => [p.id, p]))
  for (const r of unwrap(replies)) byId[r.post_id]?.replies.push(replyFromRow(r))
  return feed
}

export const createPost = async ({ group, body, anonymous }) => unwrap(await supabase.rpc('create_post', { p_group: group, p_body: body, p_anonymous: Boolean(anonymous) }))
export const createReply = async (postId, { body, anonymous }) => unwrap(await supabase.rpc('create_reply', { p_post_id: postId, p_body: body, p_anonymous: Boolean(anonymous) }))
export const toggleHelpful = async (postId) => unwrap(await supabase.rpc('toggle_helpful', { p_post_id: postId }))
export const reportItem = async (kind, id, reason) => unwrap(await supabase.rpc('report_item', { p_kind: kind, p_id: id, p_reason: reason }))

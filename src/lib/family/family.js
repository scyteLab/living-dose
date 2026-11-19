/**
 * Family helpers: a member invites a son, daughter or carer by link. The helper
 * then sees a short daily summary (check-in, warning signs, water, streak, score).
 * Live: tables and functions in migration 0015. Demo mode: this browser.
 */
import { isDemo } from '@/lib/auth'
import { isUrgent, streakOf } from '@/lib/checkin/checkins'
import { toIso } from '@/lib/mealPlan/storage'
import { supabase } from '@/lib/supabase'

const INVITES = 'ld.family.invites'
const LINKS = 'ld.family.links'
const WEEK = 7 * 24 * 60 * 60 * 1000

const read = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => window.localStorage.setItem(key, JSON.stringify(value))
const familyError = (kind) => Object.assign(new Error(kind), { kind })

/** Hard to guess, easy to read out: no 0/O or 1/I/L. */
export function newCode(length = 10) {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => abc[b % abc.length]).join('')
}

export const inviteLink = (code, origin = window.location.origin) => `${origin}/family/join/${code}`

/** Creates an invite link for the signed-in member. Resolves with the code. */
export async function createInvite(user, ownerName) {
  const code = newCode()
  const name = String(ownerName || 'Family member').slice(0, 60)
  if (isDemo) {
    write(INVITES, {
      ...read(INVITES, {}),
      [code]: { ownerId: user.id, ownerName: name, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + WEEK).toISOString() },
    })
    return code
  }
  const { error } = await supabase.from('family_invites').insert({ code, owner_id: user.id, owner_name: name })
  if (error) throw familyError('setup')
  return code
}

/** { ownerName, status: ok | used | expired | own } or null if there's no such invite. */
export async function previewInvite(code, userId) {
  if (isDemo) {
    const inv = read(INVITES, {})[code]
    if (!inv) return null
    // Demo mode has one member, so linking to yourself is allowed to try it out
    const status = inv.usedAt ? 'used' : inv.expiresAt < new Date().toISOString() ? 'expired' : 'ok'
    return { ownerName: inv.ownerName, status, demoSelf: inv.ownerId === userId }
  }
  const { data, error } = await supabase.rpc('family_invite_preview', { p_code: code })
  if (error) throw familyError('setup')
  const row = Array.isArray(data) ? data[0] : data
  return row ? { ownerName: row.owner_name, status: row.status } : null
}

/** Accept an invite as the signed-in member. Resolves with the name of the person you'll look after. */
export async function acceptInvite(code, user, helperName) {
  if (isDemo) {
    const invites = read(INVITES, {})
    const inv = invites[code]
    if (!inv) throw familyError('notFound')
    if (inv.usedAt) throw familyError('used')
    if (inv.expiresAt < new Date().toISOString()) throw familyError('expired')
    write(INVITES, { ...invites, [code]: { ...inv, usedAt: new Date().toISOString(), usedBy: user.id } })
    const links = read(LINKS, []).filter((l) => !(l.ownerId === inv.ownerId && l.helperId === user.id))
    write(LINKS, [
      ...links,
      { ownerId: inv.ownerId, helperId: user.id, ownerName: inv.ownerName, helperName: helperName || 'Family member', createdAt: new Date().toISOString() },
    ])
    return inv.ownerName
  }
  const { data, error } = await supabase.rpc('accept_family_invite', { p_code: code, p_helper_name: helperName || '' })
  if (error) {
    const m = error.message ?? ''
    throw familyError(
      m.includes('invite-used')
        ? 'used'
        : m.includes('invite-expired')
          ? 'expired'
          : m.includes('invite-own')
            ? 'own'
            : m.includes('invite-not-found')
              ? 'notFound'
              : 'setup',
    )
  }
  return data
}

/** { helpers: people who can see me, helping: people I look after } */
export async function listLinks(userId) {
  const map = (l) => ({
    ownerId: l.owner_id ?? l.ownerId,
    helperId: l.helper_id ?? l.helperId,
    ownerName: l.owner_name ?? l.ownerName,
    helperName: l.helper_name ?? l.helperName,
    createdAt: l.created_at ?? l.createdAt,
  })
  let rows
  if (isDemo) rows = read(LINKS, [])
  else {
    const { data, error } = await supabase.from('family_links').select('*').order('created_at', { ascending: true })
    if (error) throw familyError('setup')
    rows = data
  }
  const links = rows.map(map)
  return { helpers: links.filter((l) => l.ownerId === userId), helping: links.filter((l) => l.helperId === userId) }
}

/** Either side can end the link. */
export async function removeLink(ownerId, helperId) {
  if (isDemo) {
    write(
      LINKS,
      read(LINKS, []).filter((l) => !(l.ownerId === ownerId && l.helperId === helperId)),
    )
    return
  }
  const { error } = await supabase.from('family_links').delete().eq('owner_id', ownerId).eq('helper_id', helperId)
  if (error) throw familyError('setup')
}

/**
 * What a helper sees for one person, worked out from their check-in days and today's check-in.
 * status: urgent | unwell | ok | notYet | quiet (no check-in for 3 days or more)
 */
export function summarise({ ownerId, ownerName, checkinDays = [], today = null, last = null, waterToday = 0, score = null, scoreAt = null }, todayIso) {
  const streak = streakOf(
    checkinDays.map((date) => ({ date })),
    todayIso,
  )
  const lastDate = last?.date ?? checkinDays[0] ?? null
  const daysSince = lastDate ? Math.round((new Date(`${todayIso}T12:00:00`) - new Date(`${lastDate}T12:00:00`)) / 86_400_000) : null
  let status = 'notYet'
  if (today && isUrgent(today)) status = 'urgent'
  else if (today && ['unwell', 'bad'].includes(today.feeling)) status = 'unwell'
  else if (today) status = 'ok'
  else if (daysSince === null || daysSince >= 3) status = 'quiet'
  const urgent = (today?.flags ?? []).filter((f) => f.startsWith('urgent:')).map((f) => f.slice(7))
  return { ownerId, ownerName, status, urgent, today, lastDate, daysSince, streak, waterToday, score, scoreAt }
}

const checkinFromJson = (c) =>
  c && {
    date: c.day,
    feeling: c.feeling,
    sleep: c.sleep ?? null,
    symptoms: c.symptoms ?? [],
    bp: c.systolic && c.diastolic ? { systolic: c.systolic, diastolic: c.diastolic } : null,
    sugar: c.sugar_mgdl ?? null,
    flags: c.flags ?? [],
  }

/** Everyone the signed-in member looks after, summarised for today. */
export async function familyOverview(userId, now = new Date()) {
  const todayIso = toIso(now)
  if (isDemo) {
    return read(LINKS, [])
      .filter((l) => l.helperId === userId)
      .map((l) => {
        const checkins = read(`ld.checkins.${l.ownerId}`, [])
        const habits = read(`ld.habits.${l.ownerId}`, {})
        const latest = read(`ld.hc.results.${l.ownerId}`, [])[0]
        return summarise(
          {
            ownerId: l.ownerId,
            ownerName: l.ownerName,
            checkinDays: checkins
              .map((c) => c.date)
              .sort()
              .reverse(),
            today: checkins.find((c) => c.date === todayIso) ?? null,
            last: checkins.sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null,
            waterToday: habits[todayIso]?.water ?? 0,
            score: latest?.results?.score ?? null,
            scoreAt: latest?.createdAt ?? null,
          },
          todayIso,
        )
      })
  }
  const { data, error } = await supabase.rpc('family_overview')
  if (error) throw familyError('setup')
  return (data ?? []).map((r) =>
    summarise(
      {
        ownerId: r.owner_id,
        ownerName: r.owner_name,
        checkinDays: r.checkin_days ?? [],
        today: checkinFromJson(r.today_checkin),
        last: r.last_checkin ? { date: r.last_checkin.day } : null,
        waterToday: r.water_today ?? 0,
        score: r.latest_score,
        scoreAt: r.latest_score_at,
      },
      todayIso,
    ),
  )
}

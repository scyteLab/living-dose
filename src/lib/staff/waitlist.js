/**
 * Shuttle Meds waitlist and Contact messages for the staff console.
 * Live: from the contact_messages table (staff can read it after migration 0013).
 * Demo mode: the waitlist saved in this browser.
 */
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'

export const SHUTTLE_TOPIC = 'shuttle-meds'
export const ORG_TOPIC = 'shuttle-meds-org'
export const INTERESTS = ['emergency', 'doctorCall', 'mobileClinic', 'medicines']

/** Older rows only have the message text; read the details back out of it. */
export function parseWaitlistMessage(message = '') {
  const line = (label) => (message.split('\n').find((l) => l.startsWith(`${label}:`)) ?? '').slice(label.length + 1).trim()
  const [state = '', ...rest] = line('State').split(',')
  const interests = line('Interested in')
  return {
    state: state.trim(),
    community: rest.join(',').trim(),
    interests: !interests || interests === 'everything' ? [] : interests.split(',').map((x) => x.trim()),
    who: line('Signing up for') || 'self',
  }
}

/** One waitlist entry from a database row (or a demo entry). */
export function waitlistEntry(row) {
  const details = row.details ?? (row.state ? row : parseWaitlistMessage(row.message))
  return {
    id: String(row.id ?? row.at),
    at: row.created_at ?? row.at,
    name: row.name ?? '',
    contact: row.phone || row.email || row.contact || '',
    state: details.state || 'Other',
    community: details.community ?? '',
    interests: Array.isArray(details.interests) ? details.interests.filter((i) => INTERESTS.includes(i)) : [],
    who: details.who || 'self',
  }
}

const countBy = (list, pick) => {
  const counts = new Map()
  for (const item of list) for (const key of [].concat(pick(item))) counts.set(key, (counts.get(key) ?? 0) + 1)
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)))
}

/** Totals for the summary cards and bars. Empty interests mean "everything". */
export function summarise(entries, now = new Date()) {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
  return {
    total: entries.length,
    lastWeek: entries.filter((e) => new Date(e.at).getTime() >= weekAgo).length,
    states: countBy(entries, (e) => e.state).length,
    byState: countBy(entries, (e) => e.state),
    byInterest: countBy(entries, (e) => (e.interests.length ? e.interests : INTERESTS)),
    byWho: countBy(entries, (e) => e.who),
  }
}

const csvCell = (v) => {
  const s = String(v ?? '')
  // Stop spreadsheet formulas sneaking in through form answers
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(entries) {
  const head = ['Joined', 'Name', 'Phone or email', 'State', 'Town or community', 'Interested in', 'For']
  const rows = entries.map((e) => [e.at, e.name, e.contact, e.state, e.community, e.interests.join('; ') || 'everything', e.who])
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}

/** One "Bring Shuttle Meds to your place" request. */
export function orgEntry(row) {
  const d = row.details ?? row
  return {
    id: String(row.id ?? row.at),
    at: row.created_at ?? row.at,
    org: d.org ?? '',
    person: row.name ?? '',
    contact: row.phone || row.email || row.contact || '',
    setting: d.setting ?? 'other',
    group: d.group ?? 'other',
    state: d.state || 'Other',
    town: d.town ?? '',
    size: d.size ?? '',
    needs: Array.isArray(d.needs) ? d.needs.filter((i) => INTERESTS.includes(i)) : [],
    message: row.message ?? '',
  }
}

export function summariseOrgs(entries) {
  return { total: entries.length, byGroup: countBy(entries, (e) => e.group), byState: countBy(entries, (e) => e.state) }
}

export function orgsToCsv(entries, label = (x) => x) {
  const head = ['Sent', 'Organisation', 'Contact person', 'Phone or email', 'Type of place', 'State', 'Town or area', 'People', 'Needs', 'Message']
  const rows = entries.map((e) => [e.at, e.org, e.person, e.contact, label(e.setting), e.state, e.town, e.size, e.needs.join('; ') || 'everything', e.message])
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}

/** { waitlist, orgs, messages } newest first. */
export async function staffInbox() {
  if (!isSupabaseConfigured) {
    let list = []
    try {
      list = JSON.parse(window.localStorage.getItem('ld.shuttle.waitlist') ?? '[]')
    } catch {
      /* ignore */
    }
    let orgs = []
    try {
      orgs = JSON.parse(window.localStorage.getItem('ld.shuttle.orgs') ?? '[]')
    } catch {
      /* ignore */
    }
    const newest = (a, b) => (a.at < b.at ? 1 : -1)
    return { waitlist: list.map(waitlistEntry).sort(newest), orgs: orgs.map(orgEntry).sort(newest), messages: [] }
  }
  const rows = unwrap(await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(2000))
  return {
    waitlist: rows.filter((r) => r.topic === SHUTTLE_TOPIC).map(waitlistEntry),
    orgs: rows.filter((r) => r.topic === ORG_TOPIC).map(orgEntry),
    messages: rows
      .filter((r) => r.topic !== SHUTTLE_TOPIC && r.topic !== ORG_TOPIC)
      .map((r) => ({ id: String(r.id), at: r.created_at, name: r.name, email: r.email, phone: r.phone, topic: r.topic, message: r.message })),
  }
}

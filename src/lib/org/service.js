/**
 * Organisations, through the server when connected: members join with a code
 * (join_organisation), see their own organisation (my_organisation), and
 * administrators get anonymised totals worked out on the server
 * (organisation_summary). In demo mode everything is on this device.
 */
import { ORGS_BY_ID } from '@/data/organisations'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'
import { aggregate, fromServerSummary } from './aggregate'
import { joinOrganisation, leaveOrganisation, loadMembership, orgRecords } from './membership'

const remote = isSupabaseConfigured

export async function myOrganisation(userId) {
  if (!remote) {
    const m = loadMembership(userId)
    return m ? { org: ORGS_BY_ID[m.orgId], joinedAt: m.joinedAt } : null
  }
  const [row] = unwrap(await supabase.rpc('my_organisation')) ?? []
  return row ? { org: { id: row.org_id, name: row.name }, joinedAt: row.joined_at } : null
}

/** Returns { ok, reason } like the demo version. */
export async function joinWithCode(userId, code, consent) {
  if (!consent) return { ok: false, reason: 'consent' }
  if (!remote) return joinOrganisation(userId, code, consent)
  const { error } = await supabase.rpc('join_organisation', { join_code: code })
  if (error) return { ok: false, reason: String(error.message).includes('invalid-code') ? 'code' : 'failed' }
  return { ok: true }
}

export async function leave(userId) {
  if (!remote) return leaveOrganisation(userId)
  unwrap(await supabase.from('organisation_members').delete().eq('user_id', userId))
}

export async function organisationStats(orgId) {
  if (!remote) {
    const { enrolled, records } = orgRecords(orgId)
    return aggregate(records, enrolled)
  }
  return fromServerSummary(unwrap(await supabase.rpc('organisation_summary')))
}

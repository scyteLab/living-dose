/**
 * A member's link to a sponsoring organisation: chosen by the member, with
 * consent to share anonymised totals, and removable at any time.
 */
import { findByCode } from '@/data/organisations'

const key = (userId) => `ld.org.${userId}`

export function loadMembership(userId, storage = window.localStorage) {
  try {
    return JSON.parse(storage.getItem(key(userId)))
  } catch {
    return null
  }
}

export function joinOrganisation(userId, code, consent, storage = window.localStorage) {
  if (!consent) return { ok: false, reason: 'consent' }
  const org = findByCode(code)
  if (!org) return { ok: false, reason: 'code' }
  const membership = { orgId: org.id, joinedAt: new Date().toISOString(), consentAt: new Date().toISOString() }
  storage.setItem(key(userId), JSON.stringify(membership))
  return { ok: true, org, membership }
}

export const leaveOrganisation = (userId, storage = window.localStorage) => storage.removeItem(key(userId))

/**
 * Latest health check results of every member who joined this organisation.
 * Only the fields the anonymised statistics need are read.
 */
export function orgRecords(orgId, storage = window.localStorage) {
  const records = []
  let enrolled = 0
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (!k?.startsWith('ld.org.')) continue
    let m
    try {
      m = JSON.parse(storage.getItem(k))
    } catch {
      continue
    }
    if (m?.orgId !== orgId) continue
    enrolled++
    try {
      const latest = JSON.parse(storage.getItem(`ld.hc.results.${k.slice('ld.org.'.length)}`))?.[0]?.results
      if (latest && typeof latest.score === 'number') {
        records.push({ score: latest.score, band: latest.band, pillars: latest.pillars, measures: latest.measures, priorities: latest.priorities })
      }
    } catch {
      /* skip damaged records */
    }
  }
  return { enrolled, records }
}

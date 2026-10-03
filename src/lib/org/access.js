/**
 * Which organisation's portal the signed-in person may open.
 *  Live: app_metadata.role = 'org_admin' with app_metadata.org_id, set by Living Dose.
 *  Demo: a labelled switch picks a sample organisation.
 */
import { isDemo } from '@/lib/auth'
import { ORGS_BY_ID } from '@/data/organisations'

export function organisationFor(user) {
  if (!user) return null
  const app = user.app_metadata ?? {}
  if (app.role === 'org_admin' && ORGS_BY_ID[app.org_id]) return ORGS_BY_ID[app.org_id]
  if (isDemo && ORGS_BY_ID[user.user_metadata?.demoOrg]) return ORGS_BY_ID[user.user_metadata.demoOrg]
  return null
}

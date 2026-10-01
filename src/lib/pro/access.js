/**
 * Which professional, if any, the signed-in person is.
 *  Live: app_metadata.role = 'professional' and app_metadata.professional_id,
 *        set by Living Dose staff on the server after verifying registration.
 *  Demo: a labelled switch picks one of the sample professionals.
 */
import { isDemo } from '@/lib/auth'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'

export function professionalFor(user) {
  if (!user) return null
  const app = user.app_metadata ?? {}
  if (app.role === 'professional' && PROFESSIONALS_BY_ID[app.professional_id]) return PROFESSIONALS_BY_ID[app.professional_id]
  if (isDemo && PROFESSIONALS_BY_ID[user.user_metadata?.demoPro]) return PROFESSIONALS_BY_ID[user.user_metadata.demoPro]
  return null
}

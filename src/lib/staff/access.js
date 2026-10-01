/**
 * Who can open the staff console.
 *  Live: the role must be in app_metadata, which only the server can set
 *        (members can edit their own user_metadata, so it is never trusted).
 *  Demo: a clearly labelled switch sets a demo-only staff flag.
 */
import { isDemo } from '@/lib/auth'

export const STAFF_ROLES = ['staff', 'admin']

export function isStaff(user) {
  if (!user) return false
  if (STAFF_ROLES.includes(user.app_metadata?.role)) return true
  return isDemo && user.user_metadata?.demoStaff === true
}

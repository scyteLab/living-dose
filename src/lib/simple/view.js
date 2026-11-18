/**
 * Simple view: big picture buttons, larger text and read-aloud, for older
 * members or anyone who prefers fewer words. It's a setting for this phone,
 * so a grown-up child can switch it on for a parent.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { storage } from '@/lib/storage'

const EVENT = 'ld-view'
const viewKey = (userId) => `ld.view.${userId ?? 'guest'}`
const familyKey = (userId) => `ld.family.${userId ?? 'guest'}`

export function isSimple(userId) {
  return storage.get(viewKey(userId)) === 'simple'
}

export function setSimple(userId, on) {
  storage.set(viewKey(userId), on ? 'simple' : 'full')
  window.dispatchEvent(new Event(EVENT))
}

/** [simple, setSimple] for the signed-in member; every component stays in step. */
export function useSimpleView(userId) {
  const simple = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb)
      window.addEventListener('storage', cb)
      return () => {
        window.removeEventListener(EVENT, cb)
        window.removeEventListener('storage', cb)
      }
    },
    () => Boolean(userId) && isSimple(userId),
    () => false,
  )
  const set = useCallback((on) => setSimple(userId, on), [userId])
  return [simple, set]
}

/** Larger text across the app while Simple view is on. */
export function useSimpleViewClass(simple) {
  useEffect(() => {
    const root = document.documentElement
    if (simple) root.dataset.view = 'simple'
    else delete root.dataset.view
    return () => delete root.dataset.view
  }, [simple])
}

/** Keeps digits and a leading +, so the number works in a tel: link. */
export const cleanPhone = (value) => {
  const s = String(value ?? '').trim()
  return (s.startsWith('+') ? '+' : '') + s.replace(/\D/g, '')
}

export const validPhone = (value) => {
  const digits = cleanPhone(value).replace('+', '')
  return digits.length >= 7 && digits.length <= 15
}

/** The one family member to call from Simple view: { name, phone } or null. */
export function loadFamily(userId) {
  try {
    const f = JSON.parse(storage.get(familyKey(userId)))
    return f?.phone && validPhone(f.phone) ? { name: String(f.name ?? '').slice(0, 40), phone: cleanPhone(f.phone) } : null
  } catch {
    return null
  }
}

export function saveFamily(userId, family) {
  if (!family) storage.set(familyKey(userId), '')
  else
    storage.set(
      familyKey(userId),
      JSON.stringify({
        name: String(family.name ?? '')
          .trim()
          .slice(0, 40),
        phone: cleanPhone(family.phone),
      }),
    )
  window.dispatchEvent(new Event(EVENT))
}

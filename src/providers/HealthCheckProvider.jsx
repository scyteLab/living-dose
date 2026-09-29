import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { HealthCheckContext } from '@/context/HealthCheckContext'
import useAuth from '@/hooks/useAuth'
import { clearDraft, loadDraft, saveDraft } from '@/lib/healthCheck/storage'

const EMPTY = { about: {}, body: { unit: 'metric' }, eating: {}, activity: { minutes: 0, sleepHours: 7 }, habits: {}, mind: {}, history: { conditions: [] } }

/**
 * Holds the answers while someone moves through the health check.
 * Every change is saved to this device, so they can leave and pick up later.
 */
export default function HealthCheckProvider() {
  const { user } = useAuth()
  const userId = user?.id ?? 'guest'
  const [draft, setDraft] = useState(() => loadDraft(userId))
  const answers = useMemo(() => mergeAnswers(draft?.answers), [draft])
  const saveTimer = useRef(null)

  // Save shortly after the last change, not on every keystroke
  useEffect(() => {
    if (!draft) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(userId, draft), 300)
    return () => clearTimeout(saveTimer.current)
  }, [draft, userId])

  const update = useCallback((section, patch) => {
    setDraft((d) => {
      const current = mergeAnswers(d?.answers)
      return { ...d, answers: { ...current, [section]: { ...current[section], ...patch } } }
    })
  }, [])

  const reset = useCallback(() => {
    clearDraft(userId)
    setDraft(null)
  }, [userId])

  const saveNow = useCallback(() => {
    if (draft) saveDraft(userId, draft)
  }, [draft, userId])

  const value = useMemo(
    () => ({ answers, update, reset, saveNow, hasDraft: Boolean(draft?.answers), savedAt: draft?.savedAt ?? null, userId }),
    [answers, update, reset, saveNow, draft, userId],
  )

  return (
    <HealthCheckContext.Provider value={value}>
      <Outlet />
    </HealthCheckContext.Provider>
  )
}

function mergeAnswers(saved) {
  if (!saved) return EMPTY
  return Object.fromEntries(Object.keys(EMPTY).map((k) => [k, { ...EMPTY[k], ...saved[k] }]))
}

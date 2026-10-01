import { isDemo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/**
 * Drafts (answers in progress) always stay on this device, so "Save and finish later"
 * works offline. Finished results go to Supabase when connected, or stay in this
 * browser in demo mode.
 */
const draftKey = (userId) => `ld.hc.draft.${userId}`
const resultsKey = (userId) => `ld.hc.results.${userId}`

const readJson = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key))
  } catch {
    return null
  }
}
const writeJson = (key, value) => {
  try {
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: the check still works in this tab */
  }
}

export const loadDraft = (userId) => readJson(draftKey(userId))
export const saveDraft = (userId, draft) => writeJson(draftKey(userId), { ...draft, savedAt: new Date().toISOString() })
export const clearDraft = (userId) => writeJson(draftKey(userId), null)

/** Save a finished check. Resolves with the stored record. */
export async function saveResult(userId, answers, results) {
  const record = { answers, results, remind: true, createdAt: results.createdAt }

  if (isDemo) {
    const history = readJson(resultsKey(userId)) ?? []
    const stored = { id: `local-${Date.now()}`, ...record }
    writeJson(resultsKey(userId), [stored, ...history].slice(0, 12))
    return stored
  }

  const { data, error } = await supabase
    .from('health_checks')
    .insert({
      user_id: userId,
      answers,
      results,
      score: results.score,
      scoring_version: results.version,
    })
    .select('id, created_at')
    .single()
  if (error) throw error
  return { id: data.id, ...record, createdAt: data.created_at }
}

/** Ignore damaged or partial records rather than letting them break pages. */
const isComplete = (r) => Boolean(r?.results && typeof r.results.score === 'number' && r.results.pillars && r.results.measures && r.answers)

/** The most recent finished check, or null. */
export async function loadLatestResult(userId) {
  if (isDemo) {
    const latest = (readJson(resultsKey(userId)) ?? [])[0]
    return isComplete(latest) ? latest : null
  }

  const { data, error } = await supabase
    .from('health_checks')
    .select('id, answers, results, remind, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  const record = data ? { id: data.id, answers: data.answers, results: data.results, remind: data.remind, createdAt: data.created_at } : null
  return isComplete(record) ? record : null
}

/** Turn the 4-week reminder on or off for a saved check. */
export async function setReminder(userId, id, remind) {
  if (isDemo) {
    const history = readJson(resultsKey(userId)) ?? []
    writeJson(resultsKey(userId), history.map((r) => (r.id === id ? { ...r, remind } : r)))
    return
  }
  const { error } = await supabase.from('health_checks').update({ remind }).eq('id', id)
  if (error) throw error
}

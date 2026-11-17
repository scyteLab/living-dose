/**
 * Calls the AI vision function (netlify/functions/vision.mjs).
 * Returns { status: 'ok', data } when it answered, or { status: 'unavailable' }
 * when there's no AI here (local development, or no API key set yet), so the app
 * falls back to picking foods by hand. Other problems: { status: 'error', kind }.
 */
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const ENDPOINT = '/.netlify/functions/vision'

export async function callVision(mode, image) {
  const headers = { 'Content-Type': 'application/json' }
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`
  }
  let res
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ mode, image }) })
  } catch {
    return { status: 'error', kind: 'offline' }
  }
  // 404: no functions here (npm run dev). 503: no API key yet. Either way, no AI.
  if (res.status === 404 || res.status === 503) return { status: 'unavailable' }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) return { status: 'error', kind: body?.error ?? 'ai-unavailable' }
  return { status: 'ok', data: body }
}

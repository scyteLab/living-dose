/**
 * POST /.netlify/functions/vision   { mode: 'plate' | 'water', image: <JPEG data URL> }
 *
 * Sends a photo to an AI (Google Gemini or Anthropic Claude) and returns checked results:
 *   plate → { isFood, items }    (diary items, see netlify/lib/vision.mjs)
 *   water → { verified, reason }
 *
 * Settings (Netlify → Site configuration → Environment variables):
 *   GEMINI_API_KEY      free key from aistudio.google.com. Mark it as a secret.
 *   GEMINI_MODEL        optional; defaults to gemini-3.5-flash.
 *   ANTHROPIC_API_KEY   paid key from console.anthropic.com (use instead of, or as well as, Gemini).
 *   ANTHROPIC_MODEL     optional; defaults to claude-sonnet-5-5.
 *   AI_PROVIDER         optional: 'gemini' or 'claude' when both keys are set (default: claude).
 * When Supabase is set up (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY), only
 * signed-in members can use it, so the API key can't be run up by strangers.
 * Photos are never stored here.
 */
import { buildGeminiRequest, buildRequest, cleanPlate, cleanWater, geminiInput, readImage, toolInput } from '../lib/vision.mjs'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

// A light per-member limit (each function instance keeps its own count)
const recent = new Map()
function allowed(key, limit = 40, windowMs = 60 * 60 * 1000) {
  const now = Date.now()
  const times = (recent.get(key) ?? []).filter((t) => now - t < windowMs)
  if (times.length >= limit) return false
  times.push(now)
  recent.set(key, times)
  return true
}

async function memberId(req) {
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anon) return 'demo'
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } }).catch(() => null)
  if (!res?.ok) return null
  return (await res.json().catch(() => null))?.id ?? null
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405)
  const provider = pickProvider()
  if (!provider) return json({ error: 'not-configured' }, 503)

  const who = await memberId(req)
  if (!who) return json({ error: 'not-signed-in' }, 401)
  if (!allowed(who)) return json({ error: 'slow-down' }, 429)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad-request' }, 400)
  }
  const mode = body?.mode === 'water' ? 'water' : body?.mode === 'plate' ? 'plate' : null
  const image = readImage(body?.image)
  if (!mode || !image) return json({ error: 'bad-request' }, 400)

  const input = await (provider === 'gemini' ? askGemini(mode, image) : askClaude(mode, image))
  if (input === undefined) return json({ error: 'ai-unavailable' }, 502)
  return json(mode === 'plate' ? cleanPlate(input) : cleanWater(input))
}

function pickProvider() {
  const gemini = Boolean(process.env.GEMINI_API_KEY)
  const claude = Boolean(process.env.ANTHROPIC_API_KEY)
  const wanted = (process.env.AI_PROVIDER ?? '').toLowerCase()
  if (wanted === 'gemini' && gemini) return 'gemini'
  if (wanted === 'claude' && claude) return 'claude'
  return claude ? 'claude' : gemini ? 'gemini' : null
}

async function failed(name, res) {
  const detail = res ? await res.text().catch(() => '') : 'network'
  console.error(`vision: ${name} API error`, res?.status, detail.slice(0, 300))
  return undefined
}

async function askClaude(mode, image) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(buildRequest(mode, image, process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5')),
  }).catch(() => null)
  if (!res?.ok) return failed('Claude', res)
  return toolInput(await res.json())
}

async function askGemini(mode, image) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiRequest(mode, image)),
  }).catch(() => null)
  if (!res?.ok) return failed('Gemini', res)
  return geminiInput(await res.json())
}

import { isSupabaseConfigured, supabase } from './supabase'

/**
 * All sign-in logic lives here, so pages never talk to Supabase directly.
 *
 * Real mode (Supabase connected): one-time codes by SMS, WhatsApp or email.
 *   Supabase dashboard → Authentication → Providers: enable Phone (with an SMS
 *   provider such as Twilio or Termii) and Email. For email, add {{ .Token }}
 *   to the "Magic Link" template so it sends a 6-digit code.
 * Demo mode (not connected yet): nothing is sent, any 6 digits work,
 *   and the session lives in this browser tab only.
 */
export const isDemo = !isSupabaseConfigured
export const RESEND_SECONDS = 60 // matches Supabase's default wait between codes

const DEMO_KEY = 'ld.demoSession'
const DEMO_EVENT = 'ld-demo-auth'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function readDemoUser() {
  try {
    return JSON.parse(window.sessionStorage.getItem(DEMO_KEY))?.user ?? null
  } catch {
    return null
  }
}

function writeDemoUser(user) {
  try {
    if (user) window.sessionStorage.setItem(DEMO_KEY, JSON.stringify({ user }))
    else window.sessionStorage.removeItem(DEMO_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DEMO_EVENT))
}

export const DEMO_AUTH_EVENT = DEMO_EVENT

/** Turns Supabase errors into a small set of codes the pages have messages for. */
function toAuthError(error) {
  const code = error?.code ?? ''
  const message = (error?.message ?? '').toLowerCase()
  let kind = 'generic'
  if (code === 'otp_expired' || message.includes('expired')) kind = 'expired'
  else if (message.includes('invalid') || message.includes('token')) kind = 'invalid_code'
  else if (error?.status === 429 || code.includes('rate_limit') || message.includes('rate limit')) kind = 'rate_limited'
  else if (code === 'otp_disabled' || message.includes('signups not allowed')) kind = 'no_account'
  else if (message.includes('fetch') || message.includes('network')) kind = 'network'
  const err = new Error(error?.message || kind)
  err.kind = kind
  return err
}

/**
 * Send a one-time code.
 * intent 'signin' will not create a new account; 'signup' will, saving `metadata`.
 * via: 'sms' | 'whatsapp' (phone only).
 */
export async function sendCode({ channel, phone, email, intent, metadata, via = 'sms' }) {
  if (isDemo) {
    await wait(700)
    return
  }
  const options = { shouldCreateUser: intent === 'signup' }
  if (intent === 'signup' && metadata) options.data = metadata
  if (channel === 'phone') options.channel = via

  const { error } = await supabase.auth.signInWithOtp(channel === 'phone' ? { phone, options } : { email, options })
  if (error) throw toAuthError(error)
}

/** Check the code. Resolves with the signed-in user. */
export async function verifyCode({ channel, phone, email, token, metadata }) {
  if (isDemo) {
    await wait(600)
    if (token === '000000') {
      const err = new Error('invalid')
      err.kind = 'invalid_code' // lets you preview the error state in demo mode
      throw err
    }
    const existing = readDemoUser()
    const user = {
      id: 'demo-user',
      phone: phone ?? null,
      email: email ?? null,
      user_metadata: { ...(existing?.user_metadata ?? {}), ...(metadata ?? {}) },
    }
    writeDemoUser(user)
    return user
  }
  const { data, error } = await supabase.auth.verifyOtp(
    channel === 'phone' ? { phone, token, type: 'sms' } : { email, token, type: 'email' },
  )
  if (error) throw toAuthError(error)
  return data.user
}

/** Save "About you" answers to the profiles table (see supabase/migrations). */
export async function saveProfile(user, { household, goals }) {
  if (isDemo) {
    await wait(500)
    writeDemoUser({ ...user, user_metadata: { ...user.user_metadata, household, goals, onboarded: true } })
    return
  }
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, household_type: household, goals, onboarded_at: new Date().toISOString() })
  if (error) throw toAuthError(error)
  await supabase.auth.updateUser({ data: { household, goals, onboarded: true } })
}

export async function signOut() {
  if (isDemo) {
    writeDemoUser(null)
    return
  }
  await supabase.auth.signOut()
}

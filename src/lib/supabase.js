import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once .env.local has the Supabase URL and anon key. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The shared Supabase client. It is null until the env vars are set,
 * so the app still runs locally before the backend exists.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info('[Living Dose] Supabase is not configured yet. Copy .env.example to .env.local to connect.')
}

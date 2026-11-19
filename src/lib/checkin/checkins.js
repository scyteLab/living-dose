/**
 * Daily health check-in: a one-minute "how are you today?" that builds a streak
 * and gives doctors a record over time.
 *
 * Saved on the device first (works offline), then to the health_checkins table
 * (migration 0014) so the member's doctor can see it when they share results.
 */
import { isDemo } from '@/lib/auth'
import { addDays, toIso } from '@/lib/mealPlan/storage'
import { supabase } from '@/lib/supabase'

export const FEELINGS = ['great', 'good', 'okay', 'unwell', 'bad']
export const SLEEP = ['good', 'okay', 'poor']
export const SYMPTOMS = ['headache', 'dizzy', 'tired', 'fever', 'cough', 'stomach', 'bodyPain', 'chestPain', 'breathless']
export const FULL_CHECK_EVERY_DAYS = 28 // matches the health check's 4-week reminder

const key = (userId) => `ld.checkins.${userId}`

const read = (userId, storage) => {
  try {
    const list = JSON.parse(storage.getItem(key(userId)))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** All check-ins on this device, newest first. */
export const loadCheckins = (userId, storage = window.localStorage) => read(userId, storage).sort((a, b) => (a.date < b.date ? 1 : -1))

export const checkinOn = (list, date) => list.find((c) => c.date === date) ?? null

const int = (v, min, max) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

/** Keeps only valid answers. */
export function cleanCheckin(input, now = new Date()) {
  const systolic = int(input.systolic, 60, 260)
  const diastolic = int(input.diastolic, 30, 160)
  const bp = systolic && diastolic && systolic > diastolic ? { systolic, diastolic } : null
  const symptoms = [...new Set((input.symptoms ?? []).filter((s) => SYMPTOMS.includes(s)))]
  const entry = {
    date: input.date ?? toIso(now),
    at: now.toISOString(),
    feeling: FEELINGS.includes(input.feeling) ? input.feeling : null,
    sleep: SLEEP.includes(input.sleep) ? input.sleep : null,
    symptoms,
    bp,
    sugar: int(input.sugar, 20, 600), // mg/dL
    note: String(input.note ?? '')
      .trim()
      .slice(0, 300),
  }
  return { ...entry, flags: flagsFor(entry) }
}

/**
 * Things that need attention. 'urgent' flags mean "get help now".
 * Cut-offs: BP 180/110 (hypertensive crisis), sugar under 70 or 300 and over mg/dL.
 */
export function flagsFor(c) {
  const flags = []
  if (c.symptoms?.includes('chestPain')) flags.push('urgent:chestPain')
  if (c.symptoms?.includes('breathless')) flags.push('urgent:breathless')
  if (c.bp && (c.bp.systolic >= 180 || c.bp.diastolic >= 110)) flags.push('urgent:bpVeryHigh')
  else if (c.bp && (c.bp.systolic >= 140 || c.bp.diastolic >= 90)) flags.push('bpHigh')
  if (c.bp && c.bp.systolic < 90 && c.symptoms?.includes('dizzy')) flags.push('bpLow')
  if (c.sugar != null && c.sugar < 70) flags.push('urgent:sugarLow')
  else if (c.sugar != null && c.sugar >= 300) flags.push('urgent:sugarVeryHigh')
  else if (c.sugar != null && c.sugar >= 200) flags.push('sugarHigh')
  if (c.symptoms?.includes('fever')) flags.push('fever')
  return flags
}

export const isUrgent = (c) => (c?.flags ?? []).some((f) => f.startsWith('urgent:'))

/** Feeling unwell (or worse) on each of the last 3 days, including today. */
export function unwellStreak(list, today) {
  return [0, 1, 2].every((i) => ['unwell', 'bad'].includes(checkinOn(list, addDays(today, -i))?.feeling))
}

/**
 * Streak like a language app: days in a row with a check-in.
 * If today isn't done yet the streak is still alive from yesterday ("at risk").
 */
export function streakOf(list, today) {
  const days = new Set(list.map((c) => c.date))
  const doneToday = days.has(today)
  let count = 0
  let day = doneToday ? today : addDays(today, -1)
  while (days.has(day)) {
    count += 1
    day = addDays(day, -1)
  }
  // Best streak ever
  let best = 0
  let run = 0
  let prev = null
  for (const d of [...days].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { count, doneToday, atRisk: !doneToday && count > 0, best }
}

/** Monday-to-Sunday dots for this week: done, missed, today or future. */
export function weekDots(list, today) {
  const d = new Date(`${today}T12:00:00`)
  const monday = addDays(today, -((d.getDay() + 6) % 7))
  const days = new Set(list.map((c) => c.date))
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    return { date, state: days.has(date) ? 'done' : date === today ? 'today' : date > today ? 'future' : 'missed' }
  })
}

/** When the full health check is next due. */
export function fullCheckStatus(latestAt, now = new Date()) {
  if (!latestAt) return { state: 'never', daysSince: null }
  const daysSince = Math.floor((now - new Date(latestAt)) / 86_400_000)
  const state = daysSince >= FULL_CHECK_EVERY_DAYS ? 'due' : daysSince >= FULL_CHECK_EVERY_DAYS - 3 ? 'soon' : 'ok'
  return { state, daysSince, dueIn: Math.max(0, FULL_CHECK_EVERY_DAYS - daysSince) }
}

const toRow = (userId, c) => ({
  user_id: userId,
  day: c.date,
  feeling: c.feeling,
  sleep: c.sleep,
  symptoms: c.symptoms,
  systolic: c.bp?.systolic ?? null,
  diastolic: c.bp?.diastolic ?? null,
  sugar_mgdl: c.sugar,
  note: c.note || null,
  flags: c.flags,
  updated_at: c.at,
})

export const fromRow = (r) => ({
  date: r.day,
  at: r.updated_at ?? r.created_at,
  feeling: r.feeling,
  sleep: r.sleep,
  symptoms: r.symptoms ?? [],
  bp: r.systolic && r.diastolic ? { systolic: r.systolic, diastolic: r.diastolic } : null,
  sugar: r.sugar_mgdl ?? null,
  note: r.note ?? '',
  flags: r.flags ?? [],
})

/** Save today's (or an edited) check-in. Resolves with { entry, list, synced }. */
export async function saveCheckin(userId, input, { now = new Date(), storage = window.localStorage } = {}) {
  const entry = cleanCheckin(input, now)
  if (!entry.feeling) throw new Error('feeling-required')
  const list = [entry, ...read(userId, storage).filter((c) => c.date !== entry.date)].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 400)
  storage.setItem(key(userId), JSON.stringify(list))
  let synced = isDemo
  if (!isDemo) {
    const { error } = await supabase.from('health_checkins').upsert(toRow(userId, entry), { onConflict: 'user_id,day' })
    synced = !error
  }
  return { entry, list, synced }
}

/** Brings check-ins from other devices down, keeping whichever copy is newer. */
export async function pullCheckins(userId, storage = window.localStorage) {
  const local = read(userId, storage)
  if (isDemo) return loadCheckins(userId, storage)
  const { data, error } = await supabase.from('health_checkins').select('*').eq('user_id', userId).order('day', { ascending: false }).limit(400)
  if (error) return loadCheckins(userId, storage)
  const byDay = new Map(local.map((c) => [c.date, c]))
  for (const row of data) {
    const remote = fromRow(row)
    const mine = byDay.get(remote.date)
    if (!mine || (remote.at ?? '') > (mine.at ?? '')) byDay.set(remote.date, remote)
  }
  const merged = [...byDay.values()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 400)
  storage.setItem(key(userId), JSON.stringify(merged))
  // Anything only on this device (saved offline) goes up now
  const missing = merged.filter((c) => !data.some((r) => r.day === c.date))
  if (missing.length)
    await supabase.from('health_checkins').upsert(
      missing.map((c) => toRow(userId, c)),
      { onConflict: 'user_id,day' },
    )
  return merged
}

/**
 * Appointments. With Supabase configured they go through book_appointment()
 * and cancel_appointment(), which check every rule on the server
 * (supabase/migrations/0009_secure_shop_and_care.sql). In demo mode they're
 * kept on this device. Also builds calendar files.
 */
import { care } from '@/config/care'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'

const remote = isSupabaseConfigured

/** A row from the appointments table in the app's shape. */
export function appointmentFromRow(row) {
  const s = Array.isArray(row.consultation_summaries) ? row.consultation_summaries[0] : row.consultation_summaries
  return {
    id: row.id,
    userId: row.user_id,
    professionalId: row.professional_id,
    type: row.type,
    start: new Date(row.starts_at).toISOString(),
    minutes: row.minutes,
    fee: row.fee,
    topic: row.topic,
    note: row.note,
    shareResults: Boolean(row.share_results),
    memberName: row.member_name ?? null,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at ?? null,
    summary: s ? { summary: s.summary, nextSteps: s.next_steps ?? [], followUp: s.follow_up, writtenAt: s.written_at } : null,
  }
}

const slotKey = (professionalId, start) => `${professionalId}|${new Date(start).toISOString()}`

/** Times already taken, as "professionalId|ISO time" keys. From the server when connected. */
export async function loadBookedSlots(professionalIds = null) {
  if (!remote) return bookedSlots()
  const rows = unwrap(await supabase.rpc('booked_slots', { p_professional_ids: professionalIds }))
  return new Set(rows.map((r) => slotKey(r.professional_id, r.starts_at)))
}

const key = (userId) => `ld.appointments.${userId}`
const BOOKED_KEY = 'ld.booked' // stands in for the server's view of taken slots

const read = (k, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(k)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (k, v) => window.localStorage.setItem(k, JSON.stringify(v))

export const bookedSlots = () => new Set(read(BOOKED_KEY, []))

function newRef() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += letters[Math.floor(Math.random() * letters.length)]
  return `LC-${code}`
}

export async function bookAppointment(userId, { professionalId, type, start, topic, note, shareResults, memberName }) {
  if (remote) {
    // The server sets the fee and checks the time, hours, days off and that the slot is free
    const made = unwrap(
      await supabase.rpc('book_appointment', {
        p_professional_id: professionalId,
        p_type: type,
        p_starts_at: start,
        p_topic: topic ?? null,
        p_note: note?.trim() || null,
        p_share_results: Boolean(shareResults),
        p_member_name: memberName || null,
      }),
    )
    return (await getAppointment(userId, made.id)) ?? { id: made.id }
  }
  const booked = bookedSlots()
  const slotKey = `${professionalId}|${start}`
  if (booked.has(slotKey)) {
    const err = new Error('taken')
    err.kind = 'taken'
    throw err
  }
  const pro = PROFESSIONALS_BY_ID[professionalId]
  const appt = {
    id: newRef(),
    professionalId,
    type,
    start,
    minutes: care.slotMinutes,
    fee: pro.fees[type],
    topic,
    note: note?.trim() || null,
    shareResults: Boolean(shareResults),
    memberName: memberName || null,
    status: 'booked',
    createdAt: new Date().toISOString(),
  }
  write(key(userId), [appt, ...read(key(userId), [])])
  write(BOOKED_KEY, [...booked, slotKey])
  return appt
}

const SELECT = '*, consultation_summaries(*)'

export async function listAppointments(userId) {
  if (!remote) return read(key(userId), [])
  return unwrap(await supabase.from('appointments').select(SELECT).order('starts_at', { ascending: true })).map(appointmentFromRow)
}

export async function getAppointment(userId, id) {
  if (!remote) return read(key(userId), []).find((a) => a.id === id) ?? null
  const row = unwrap(await supabase.from('appointments').select(SELECT).eq('id', id).maybeSingle())
  return row ? appointmentFromRow(row) : null
}

export async function cancelAppointment(userId, id) {
  if (remote) {
    unwrap(await supabase.rpc('cancel_appointment', { p_id: id }))
    return getAppointment(userId, id)
  }
  const list = read(key(userId), [])
  const appt = list.find((a) => a.id === id)
  if (!appt) return null
  const updated = { ...appt, status: 'cancelled', cancelledAt: new Date().toISOString() }
  write(key(userId), list.map((a) => (a.id === id ? updated : a)))
  write(BOOKED_KEY, [...bookedSlots()].filter((k) => k !== `${appt.professionalId}|${appt.start}`))
  return updated
}

/** Can it still be changed for free? */
export const freeToCancel = (appt, now = new Date()) =>
  new Date(appt.start).getTime() - now.getTime() >= care.freeCancellationHours * 60 * 60 * 1000

/** Joining opens a few minutes before the start and closes at the end. */
export function joinState(appt, now = new Date()) {
  const start = new Date(appt.start).getTime()
  const opens = start - care.joinOpensMinutesBefore * 60 * 1000
  const ends = start + appt.minutes * 60 * 1000
  if (appt.status === 'cancelled') return 'cancelled'
  if (now.getTime() >= ends) return 'ended'
  if (now.getTime() >= opens) return 'open'
  return 'waiting'
}

const icsDate = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const icsText = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`)

/** A calendar file (works with Google, Apple and Outlook calendars). */
export function toIcs(appt, { title, description }) {
  const end = new Date(new Date(appt.start).getTime() + appt.minutes * 60 * 1000).toISOString()
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Living Dose//Care//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${appt.id}@livingdose`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(appt.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

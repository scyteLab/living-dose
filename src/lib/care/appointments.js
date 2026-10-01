/**
 * Appointments are kept on this device for now (Supabase later, see
 * supabase/migrations/0004_appointments.sql). Also builds calendar files.
 */
import { care } from '@/config/care'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'

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

export async function bookAppointment(userId, { professionalId, type, start, topic, note, shareResults }) {
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
    status: 'booked',
    createdAt: new Date().toISOString(),
  }
  write(key(userId), [appt, ...read(key(userId), [])])
  write(BOOKED_KEY, [...booked, slotKey])
  return appt
}

export const listAppointments = async (userId) => read(key(userId), [])
export const getAppointment = async (userId, id) => read(key(userId), []).find((a) => a.id === id) ?? null

export async function cancelAppointment(userId, id) {
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

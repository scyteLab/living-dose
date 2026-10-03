/**
 * What the professionals' portal calls. With Supabase configured it uses the
 * professional's own consultations, the shared-results view, and the checked
 * functions in 0010; in demo mode it uses this browser (lib/pro/api.js).
 */
import { appointmentFromRow } from '@/lib/care/appointments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'
import { appointmentsFor, findAppointment, loadNote, saveNote, saveSummary, setStatus, sharedResults } from './api'
import { loadSchedule, saveSchedule } from './schedule'

const remote = isSupabaseConfigured
const local = () => window.localStorage

export async function proAppointments(proId) {
  if (!remote) return appointmentsFor(local(), proId)
  return unwrap(await supabase.from('appointments').select('*, consultation_summaries(*)').eq('professional_id', proId).order('starts_at', { ascending: true })).map(appointmentFromRow)
}

/** The consultation, the member's shared results (if any) and the private note, together. */
export async function proConsultation(proId, id) {
  if (!remote) {
    const appt = findAppointment(local(), proId, id)
    return { appt, results: sharedResults(local(), appt), note: appt ? loadNote(local(), proId, id) : '' }
  }
  const row = unwrap(await supabase.from('appointments').select('*, consultation_summaries(*)').eq('id', id).eq('professional_id', proId).maybeSingle())
  if (!row) return { appt: null, results: null, note: '' }
  const [shared, note] = await Promise.all([
    supabase.from('shared_results').select('*').eq('appointment_id', id).maybeSingle(),
    supabase.from('professional_notes').select('note').eq('appointment_id', id).maybeSingle(),
  ])
  const r = shared.data
  return {
    appt: appointmentFromRow(row),
    results: r ? { score: r.score, band: r.band, pillars: r.pillars, measures: r.measures, priorities: r.priorities, createdAt: r.created_at } : null,
    note: note.data?.note ?? '',
  }
}

export async function proSaveSummary(appt, { summary, nextSteps, followUp }) {
  if (!remote) return saveSummary(local(), appt, { summary, nextSteps, followUp })
  unwrap(await supabase.rpc('save_consultation_summary', { p_appointment_id: appt.id, p_summary: summary, p_next_steps: nextSteps, p_follow_up: followUp }))
}

export async function proMark(appt, status) {
  if (!remote) return setStatus(local(), appt, status)
  unwrap(await supabase.rpc('mark_consultation', { p_appointment_id: appt.id, p_status: status }))
}

export async function proSaveNote(proId, apptId, text) {
  if (!remote) return saveNote(local(), proId, apptId, text)
  unwrap(await supabase.from('professional_notes').upsert({ appointment_id: apptId, professional_id: proId, note: text, updated_at: new Date().toISOString() }))
}

export async function proLoadSchedule(pro) {
  if (!remote) return loadSchedule(pro)
  const row = unwrap(await supabase.from('professional_schedules').select('*').eq('professional_id', pro.id).maybeSingle())
  return row ? { hours: row.hours, daysOff: row.days_off ?? [] } : { hours: pro.schedule, daysOff: [] }
}

export async function proSaveSchedule(proId, { hours, daysOff }) {
  if (!remote) return saveSchedule(proId, { hours, daysOff })
  unwrap(await supabase.from('professional_schedules').upsert({ professional_id: proId, hours, days_off: [...new Set(daysOff)].sort(), updated_at: new Date().toISOString() }))
}

/** Everyone's saved hours and days off, for showing bookable times to members. */
export async function loadAllSchedules(pros) {
  if (!remote) return Object.fromEntries(pros.map((p) => [p.id, loadSchedule(p)]))
  const rows = unwrap(await supabase.from('professional_schedules').select('*'))
  const saved = Object.fromEntries(rows.map((r) => [r.professional_id, { hours: r.hours, daysOff: r.days_off ?? [] }]))
  return Object.fromEntries(pros.map((p) => [p.id, saved[p.id] ?? { hours: p.schedule, daysOff: [] }]))
}

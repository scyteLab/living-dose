/**
 * Professionals' portal data. Reads what is stored in this browser today;
 * later each function becomes a Supabase query limited by row-level security
 * to the professional's own consultations (supabase/migrations/0007_professionals.sql).
 */
const read = (storage, k, fallback) => {
  try {
    return JSON.parse(storage.getItem(k)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (storage, k, v) => storage.setItem(k, JSON.stringify(v))

const keysWith = (storage, prefix) => {
  const out = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k?.startsWith(prefix)) out.push(k)
  }
  return out
}

/** Every consultation booked with this professional, soonest first. */
export function appointmentsFor(storage, proId) {
  return keysWith(storage, 'ld.appointments.')
    .flatMap((k) => read(storage, k, []).map((a) => ({ ...a, userId: k.slice('ld.appointments.'.length) })))
    .filter((a) => a.professionalId === proId)
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function findAppointment(storage, proId, id) {
  return appointmentsFor(storage, proId).find((a) => a.id === id) ?? null
}

/**
 * The member's latest health check, only when they chose to share it with this booking.
 * Returns the score and key numbers, never their individual answers.
 */
export function sharedResults(storage, appt) {
  if (!appt?.shareResults) return null
  const latest = read(storage, `ld.hc.results.${appt.userId}`, [])[0]
  const r = latest?.results
  if (!r || typeof r.score !== 'number') return null
  return { score: r.score, band: r.band, pillars: r.pillars, measures: r.measures, priorities: r.priorities, createdAt: latest.createdAt }
}

/** Summary and next steps: saved on the appointment, so the member sees them. */
export function saveSummary(storage, appt, { summary, nextSteps, followUp }) {
  const k = `ld.appointments.${appt.userId}`
  const clean = {
    summary: summary.trim(),
    nextSteps: nextSteps.map((s) => s.trim()).filter(Boolean),
    followUp: followUp || null,
    writtenAt: new Date().toISOString(),
  }
  write(storage, k, read(storage, k, []).map((a) => (a.id === appt.id ? { ...a, summary: clean, status: 'completed' } : a)))
  return clean
}

/** Private notes: kept apart from the appointment and never shown to the member. */
const notesKey = (proId) => `ld.pro.notes.${proId}`
export const loadNote = (storage, proId, apptId) => read(storage, notesKey(proId), {})[apptId] ?? ''
export function saveNote(storage, proId, apptId, text) {
  write(storage, notesKey(proId), { ...read(storage, notesKey(proId), {}), [apptId]: text })
}

export function setStatus(storage, appt, status) {
  const k = `ld.appointments.${appt.userId}`
  write(storage, k, read(storage, k, []).map((a) => (a.id === appt.id ? { ...a, status } : a)))
}

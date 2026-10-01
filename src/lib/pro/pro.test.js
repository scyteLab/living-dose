import { describe, expect, it } from 'vitest'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import { availableDays, lagosTime } from '@/lib/care/availability'
import { appointmentsFor, loadNote, saveNote, saveSummary, sharedResults } from './api'
import { validHours } from './schedule'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]))
  return { get length() { return map.size }, key: (i) => [...map.keys()][i] ?? null, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) }
}

const seed = () =>
  memoryStorage({
    'ld.appointments.u1': [
      { id: 'LC-1', professionalId: 'funmi-adeyemi', start: '2026-10-02T09:00:00Z', minutes: 30, shareResults: true, status: 'booked' },
      { id: 'LC-2', professionalId: 'kemi-alade', start: '2026-10-02T10:00:00Z', minutes: 30, shareResults: true, status: 'booked' },
    ],
    'ld.appointments.u2': [{ id: 'LC-3', professionalId: 'funmi-adeyemi', start: '2026-10-01T15:00:00Z', minutes: 30, shareResults: false, status: 'booked' }],
    'ld.hc.results.u1': [{ createdAt: '2026-09-29', answers: { secret: 'answers' }, results: { score: 69, band: 'good', pillars: {}, measures: { bmi: 27.1 }, priorities: [] } }],
    'ld.hc.results.u2': [{ createdAt: '2026-09-29', results: { score: 50 } }],
  })

describe('professional portal', () => {
  it('shows a professional only their own consultations, soonest first', () => {
    expect(appointmentsFor(seed(), 'funmi-adeyemi').map((a) => a.id)).toEqual(['LC-3', 'LC-1'])
  })

  it('shares health check results only when the member agreed, and never their answers', () => {
    const s = seed()
    const [noShare, share] = appointmentsFor(s, 'funmi-adeyemi')
    expect(sharedResults(s, noShare)).toBeNull()
    const r = sharedResults(s, share)
    expect(r.score).toBe(69)
    expect(r.answers).toBeUndefined()
    expect(JSON.stringify(r)).not.toContain('secret')
  })

  it('saves the summary on the member\'s appointment and completes it', () => {
    const s = seed()
    const appt = appointmentsFor(s, 'funmi-adeyemi')[1]
    saveSummary(s, appt, { summary: '  Good start.  ', nextSteps: ['Walk 20 minutes', '  ', 'Swap one drink'], followUp: '4weeks' })
    const saved = JSON.parse(s.getItem('ld.appointments.u1')).find((a) => a.id === 'LC-1')
    expect(saved.status).toBe('completed')
    expect(saved.summary.summary).toBe('Good start.')
    expect(saved.summary.nextSteps).toEqual(['Walk 20 minutes', 'Swap one drink'])
  })

  it('keeps private notes out of the member\'s appointment', () => {
    const s = seed()
    saveNote(s, 'funmi-adeyemi', 'LC-1', 'Private clinical note')
    expect(loadNote(s, 'funmi-adeyemi', 'LC-1')).toBe('Private clinical note')
    expect(s.getItem('ld.appointments.u1')).not.toContain('Private clinical note')
  })
})

describe('schedules', () => {
  it('validates working hours', () => {
    expect(validHours([9, 17])).toBe(true)
    expect(validHours([17, 9])).toBe(false)
    expect(validHours([5, 9])).toBe(false)
    expect(validHours(null)).toBe(true)
  })

  it('stops bookings on days off', () => {
    const funmi = PROFESSIONALS_BY_ID['funmi-adeyemi']
    const now = lagosTime(2026, 9, 30, 8)
    const normal = availableDays(funmi, { now, days: 3 }).map((d) => d.date)
    expect(normal).toContain('2026-10-01')
    const off = availableDays({ ...funmi, daysOff: ['2026-10-01'] }, { now, days: 3 }).map((d) => d.date)
    expect(off).not.toContain('2026-10-01')
  })
})

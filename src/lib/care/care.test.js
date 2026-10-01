import { describe, expect, it } from 'vitest'
import { PROFESSIONALS, PROFESSIONALS_BY_ID } from '@/data/professionals'
import { availableDays, lagosDay, lagosTime, nextAvailable } from './availability'
import { freeToCancel, joinState, toIcs } from './appointments'

// Wednesday 30 September 2026, 10:00 in Lagos
const NOW = lagosTime(2026, 9, 30, 10)

describe('Lagos time', () => {
  it('is UTC+1', () => {
    expect(lagosTime(2026, 9, 30, 10).toISOString()).toBe('2026-09-30T09:00:00.000Z')
    expect(lagosDay(NOW)).toEqual({ iso: '2026-09-30', weekday: 2 })
  })
})

describe('availability', () => {
  const funmi = PROFESSIONALS_BY_ID['funmi-adeyemi'] // Wednesday 12:00–19:00

  it('only offers days they work, in 30-minute slots within their hours', () => {
    const days = availableDays(funmi, { now: NOW, days: 7 })
    const weekdays = days.map((d) => lagosDay(new Date(`${d.date}T12:00:00+01:00`)).weekday)
    weekdays.forEach((w) => expect(Object.keys(funmi.schedule).map(Number)).toContain(w))
    const wed = days.find((d) => d.date === '2026-09-30')
    expect(wed.slots[0]).toBe('2026-09-30T11:00:00.000Z') // 12:00 Lagos
    expect(wed.slots.at(-1)).toBe('2026-09-30T17:30:00.000Z') // 18:30 Lagos, ends at 19:00
  })

  it('never offers a time within the next hour', () => {
    const lateMorning = lagosTime(2026, 9, 30, 11, 45)
    const first = nextAvailable(funmi, { now: lateMorning })
    expect(new Date(first).getTime() - lateMorning.getTime()).toBeGreaterThanOrEqual(60 * 60 * 1000)
  })

  it('removes booked slots', () => {
    const booked = new Set([`funmi-adeyemi|2026-09-30T11:00:00.000Z`])
    const wed = availableDays(funmi, { now: NOW, days: 1, booked })[0]
    expect(wed.slots).not.toContain('2026-09-30T11:00:00.000Z')
  })

  it('gives every professional something to book in the next two weeks', () => {
    PROFESSIONALS.forEach((p) => expect(nextAvailable(p, { now: NOW })).toBeTruthy())
  })
})

describe('appointments', () => {
  const appt = { id: 'LC-TEST01', start: '2026-10-01T09:00:00.000Z', minutes: 30, status: 'booked' }

  it('opens joining 10 minutes before', () => {
    expect(joinState(appt, new Date('2026-10-01T08:49:00Z'))).toBe('waiting')
    expect(joinState(appt, new Date('2026-10-01T08:51:00Z'))).toBe('open')
    expect(joinState(appt, new Date('2026-10-01T09:31:00Z'))).toBe('ended')
    expect(joinState({ ...appt, status: 'cancelled' })).toBe('cancelled')
  })

  it('allows free cancellation up to 4 hours before', () => {
    expect(freeToCancel(appt, new Date('2026-10-01T04:00:00Z'))).toBe(true)
    expect(freeToCancel(appt, new Date('2026-10-01T06:00:00Z'))).toBe(false)
  })

  it('makes a valid calendar file', () => {
    const ics = toIcs(appt, { title: 'Video call with Funmi Adeyemi', description: 'Living Dose, ref LC-TEST01' })
    expect(ics).toContain('DTSTART:20261001T090000Z')
    expect(ics).toContain('DTEND:20261001T093000Z')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})

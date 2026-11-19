import { beforeEach, describe, expect, it } from 'vitest'
import { cleanCheckin, flagsFor, fullCheckStatus, isUrgent, loadCheckins, saveCheckin, streakOf, unwellStreak, weekDots } from './checkins'
import { sharedCheckins, sharedScores } from '@/lib/pro/api'

const mem = () => {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
}
const days = (...dates) => dates.map((date) => ({ date, feeling: 'good', symptoms: [], flags: [] }))

let storage
beforeEach(() => {
  storage = mem()
  globalThis.window = { localStorage: storage }
})

describe('cleaning answers', () => {
  it('keeps valid answers and drops nonsense', () => {
    const c = cleanCheckin({
      date: '2026-11-19',
      feeling: 'good',
      sleep: 'zzz',
      symptoms: ['cough', 'cough', 'alien'],
      systolic: '128',
      diastolic: '84',
      sugar: '9999',
      note: '  ok  ',
    })
    expect(c).toMatchObject({ feeling: 'good', sleep: null, symptoms: ['cough'], bp: { systolic: 128, diastolic: 84 }, sugar: null, note: 'ok', flags: [] })
  })

  it('ignores a blood pressure where the numbers are the wrong way round or half missing', () => {
    expect(cleanCheckin({ feeling: 'okay', systolic: '80', diastolic: '120' }).bp).toBeNull()
    expect(cleanCheckin({ feeling: 'okay', systolic: '120' }).bp).toBeNull()
  })
})

describe('warning signs', () => {
  it('treats chest pain, hard breathing, very high BP and low or very high sugar as urgent', () => {
    expect(isUrgent(cleanCheckin({ feeling: 'bad', symptoms: ['chestPain'] }))).toBe(true)
    expect(isUrgent(cleanCheckin({ feeling: 'bad', symptoms: ['breathless'] }))).toBe(true)
    expect(flagsFor({ bp: { systolic: 185, diastolic: 100 }, symptoms: [] })).toContain('urgent:bpVeryHigh')
    expect(flagsFor({ bp: { systolic: 150, diastolic: 95 }, symptoms: [] })).toEqual(['bpHigh'])
    expect(flagsFor({ sugar: 60, symptoms: [] })).toEqual(['urgent:sugarLow'])
    expect(flagsFor({ sugar: 320, symptoms: [] })).toEqual(['urgent:sugarVeryHigh'])
    expect(flagsFor({ sugar: 220, symptoms: [] })).toEqual(['sugarHigh'])
    expect(isUrgent(cleanCheckin({ feeling: 'good', systolic: '120', diastolic: '80', sugar: '100' }))).toBe(false)
  })

  it('notices three unwell days in a row', () => {
    const list = ['2026-11-17', '2026-11-18', '2026-11-19'].map((date) => ({ date, feeling: 'unwell' }))
    expect(unwellStreak(list, '2026-11-19')).toBe(true)
    expect(unwellStreak(list.slice(1), '2026-11-19')).toBe(false)
  })
})

describe('streaks', () => {
  it('counts days in a row, including today', () => {
    expect(streakOf(days('2026-11-17', '2026-11-18', '2026-11-19'), '2026-11-19')).toMatchObject({ count: 3, doneToday: true, atRisk: false })
  })

  it("keeps yesterday's streak alive until today ends", () => {
    expect(streakOf(days('2026-11-17', '2026-11-18'), '2026-11-19')).toMatchObject({ count: 2, doneToday: false, atRisk: true })
  })

  it('resets after a missed day but remembers the best', () => {
    const s = streakOf(days('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-19'), '2026-11-19')
    expect(s).toMatchObject({ count: 1, best: 4 })
    expect(streakOf([], '2026-11-19')).toMatchObject({ count: 0, atRisk: false })
  })

  it('shows this week Monday to Sunday', () => {
    const dots = weekDots(days('2026-11-16', '2026-11-18'), '2026-11-19') // Thursday
    expect(dots.map((d) => d.state)).toEqual(['done', 'missed', 'done', 'today', 'future', 'future', 'future'])
  })
})

describe('monthly full check', () => {
  const now = new Date('2026-11-19T12:00:00Z')
  it('is due after 4 weeks, and "soon" a few days before', () => {
    expect(fullCheckStatus(null, now).state).toBe('never')
    expect(fullCheckStatus('2026-11-01T12:00:00Z', now)).toMatchObject({ state: 'ok', dueIn: 10 })
    expect(fullCheckStatus('2026-10-24T12:00:00Z', now)).toMatchObject({ state: 'soon', dueIn: 2 })
    expect(fullCheckStatus('2026-10-01T12:00:00Z', now).state).toBe('due')
  })
})

describe('saving', () => {
  it('saves one check-in per day, replacing an earlier answer the same day', async () => {
    await saveCheckin('u1', { date: '2026-11-19', feeling: 'okay' }, { storage })
    await saveCheckin('u1', { date: '2026-11-19', feeling: 'great' }, { storage })
    await saveCheckin('u1', { date: '2026-11-18', feeling: 'good' }, { storage })
    const list = loadCheckins('u1', storage)
    expect(list.map((c) => [c.date, c.feeling])).toEqual([
      ['2026-11-19', 'great'],
      ['2026-11-18', 'good'],
    ])
  })

  it('needs a feeling', async () => {
    await expect(saveCheckin('u1', { date: '2026-11-19' }, { storage })).rejects.toThrow('feeling-required')
  })
})

describe('what the doctor sees', () => {
  it('shows the last 60 days of check-ins and the score history only when the member shared results', async () => {
    await saveCheckin('m1', { date: '2026-11-18', feeling: 'unwell', systolic: '150', diastolic: '95' }, { storage })
    await saveCheckin('m1', { date: '2026-08-01', feeling: 'good' }, { storage })
    storage.setItem(
      'ld.hc.results.m1',
      JSON.stringify([
        { createdAt: '2026-11-01', results: { score: 70, band: 'good' } },
        { createdAt: '2026-10-01', results: { score: 62, band: 'grow' } },
      ]),
    )
    const appt = { userId: 'm1', startsAt: '2026-11-20T10:00:00Z', shareResults: true }
    expect(sharedCheckins(storage, appt).map((c) => c.date)).toEqual(['2026-11-18'])
    expect(sharedScores(storage, appt).map((s) => s.score)).toEqual([62, 70])
    expect(sharedCheckins(storage, { ...appt, shareResults: false })).toEqual([])
    expect(sharedScores(storage, { ...appt, shareResults: false })).toEqual([])
  })
})

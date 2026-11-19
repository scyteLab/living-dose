/* global process */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { familyAlertMessage, inQuietHours, lagosNow, reminderMessage, shouldRemind, streakBefore, urgentKeys } from './push.mjs'
import { sendToUsers } from './pushServer.mjs'
import { runReminders } from '../functions/push-reminders.mjs'
import { keyBytes } from '../../src/lib/push/push.js'

// 17:10 UTC = 18:10 in Lagos
const at18 = new Date('2026-11-19T17:10:00Z')

describe('Lagos time and quiet hours', () => {
  it('works out the Lagos date and time', () => {
    expect(lagosNow(at18)).toEqual({ date: '2026-11-19', minutes: 18 * 60 + 10 })
    expect(lagosNow(new Date('2026-11-19T23:30:00Z')).date).toBe('2026-11-20')
  })

  it('handles quiet hours that cross midnight', () => {
    expect(inQuietHours(22 * 60, '21:30', '07:00')).toBe(true)
    expect(inQuietHours(6 * 60, '21:30', '07:00')).toBe(true)
    expect(inQuietHours(12 * 60, '21:30', '07:00')).toBe(false)
    expect(inQuietHours(13 * 60, '12:00', '14:00')).toBe(true)
  })
})

describe('check-in reminders', () => {
  const prefs = { checkIn: true, checkInTime: '18:00', channels: { push: true }, quietStart: '21:30', quietEnd: '07:00' }

  it("reminds in the chosen hour if they haven't checked in", () => {
    expect(shouldRemind({ prefs, now: at18, checkedInToday: false, alreadySent: false })).toBe(true)
    expect(shouldRemind({ prefs: undefined, now: at18, checkedInToday: false, alreadySent: false })).toBe(true) // defaults: 18:00
  })

  it('stays quiet when done, already sent, switched off, another hour or quiet time', () => {
    expect(shouldRemind({ prefs, now: at18, checkedInToday: true, alreadySent: false })).toBe(false)
    expect(shouldRemind({ prefs, now: at18, checkedInToday: false, alreadySent: true })).toBe(false)
    expect(shouldRemind({ prefs: { ...prefs, checkIn: false }, now: at18, checkedInToday: false, alreadySent: false })).toBe(false)
    expect(shouldRemind({ prefs: { ...prefs, channels: { push: false } }, now: at18, checkedInToday: false, alreadySent: false })).toBe(false)
    expect(shouldRemind({ prefs: { ...prefs, checkInTime: '09:00' }, now: at18, checkedInToday: false, alreadySent: false })).toBe(false)
    expect(
      shouldRemind({ prefs: { ...prefs, checkInTime: '18:00', quietStart: '17:00', quietEnd: '07:00' }, now: at18, checkedInToday: false, alreadySent: false }),
    ).toBe(false)
  })

  it('mentions the streak they could lose', () => {
    expect(streakBefore(['2026-11-18', '2026-11-17', '2026-11-15'], '2026-11-19')).toBe(2)
    expect(reminderMessage('Ada', 2).title).toContain('2-day streak')
    expect(reminderMessage(null, 0)).toMatchObject({ title: 'Your daily check-in', body: 'How are you today? It takes one minute.', url: '/check-in' })
  })
})

describe('family alerts', () => {
  it('only counts real warning signs', () => {
    expect(urgentKeys(['bpHigh', 'urgent:chestPain', 'urgent:sugarLow'])).toEqual(['chestPain', 'sugarLow'])
    expect(urgentKeys(null)).toEqual([])
    expect(familyAlertMessage('Mama', ['chestPain'])).toMatchObject({ title: '⚠️ Mama reported chest pain', url: '/family', urgent: true })
  })
})

// A tiny stand-in for the Supabase client, enough for these functions
function fakeDb(tables) {
  const calls = []
  const query = (table) => {
    let rows = [...(tables[table] ?? [])]
    const q = {
      select: () => q,
      eq: (col, v) => ((rows = rows.filter((r) => r[col] === v)), q),
      in: (col, vs) => ((rows = rows.filter((r) => vs.includes(r[col]))), q),
      gte: (col, v) => ((rows = rows.filter((r) => r[col] >= v)), q),
      delete: () => (calls.push(['delete', table]), q),
      update: (v) => (calls.push(['update', table, v]), q),
      upsert: (v) => (calls.push(['upsert', table, v]), Promise.resolve({ error: null })),
      then: (resolve) => resolve({ data: rows, error: null }),
    }
    return q
  }
  return { from: query, calls }
}

describe('sending', () => {
  beforeEach(() => {
    process.env.VAPID_PUBLIC_KEY = 'BNfakeKeyForTests'
    process.env.VAPID_PRIVATE_KEY = 'priv'
  })

  it('sends to every device and removes ones that are gone', async () => {
    const db = fakeDb({
      push_subscriptions: [
        { endpoint: 'a', user_id: 'u1', p256dh: 'p', auth: 'x' },
        { endpoint: 'b', user_id: 'u1', p256dh: 'p', auth: 'x' },
      ],
    })
    const send = vi.fn(async (sub) => {
      if (sub.endpoint === 'b') throw Object.assign(new Error('gone'), { statusCode: 410 })
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = await sendToUsers(db, ['u1'], { title: 't' }, { send })
    expect(ok).toBe(1)
    expect(db.calls.some(([op, t]) => op === 'delete' && t === 'push_subscriptions')).toBe(true)
  })

  it('the hourly run reminds only those who are due, with their streak', async () => {
    const db = fakeDb({
      push_subscriptions: [{ user_id: 'due' }, { user_id: 'done' }, { user_id: 'morning' }, { user_id: 'due' }],
      user_documents: [{ user_id: 'morning', kind: 'notifications', data: { checkInTime: '08:00' } }],
      health_checkins: [
        { user_id: 'done', day: '2026-11-19' },
        { user_id: 'due', day: '2026-11-18' },
        { user_id: 'due', day: '2026-11-17' },
      ],
      push_log: [],
      profiles: [{ id: 'due', first_name: 'Ada' }],
    })
    const sent = []
    const result = await runReminders(db, at18, { sendTo: async (_db, ids, msg) => (sent.push([ids, msg]), 1) })
    expect(result).toEqual({ sent: 1, considered: 3 })
    expect(sent[0][0]).toEqual(['due'])
    expect(sent[0][1]).toMatchObject({ title: '🔥 Keep your 2-day streak', body: 'Ada, how are you today? It takes one minute.' })
    expect(db.calls.some(([op, t]) => op === 'upsert' && t === 'push_log')).toBe(true)
  })
})

describe('browser key', () => {
  it('turns the server key into bytes', () => {
    expect(Array.from(keyBytes('AQID'))).toEqual([1, 2, 3])
    expect(Array.from(keyBytes('-_8'))).toEqual([251, 255])
  })
})

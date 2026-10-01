import { describe, expect, it } from 'vitest'
import { buildExport, collectData, deleteLocalData } from './data'
import { DEFAULT_NOTIFICATIONS, hasChannel, validateMember } from './settings'

/** A tiny in-memory stand-in for localStorage. */
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), keys: () => [...map.keys()] }
}

describe('download my data', () => {
  const store = memoryStorage({
    'ld.hc.results.u1': JSON.stringify([{ id: 'hc1' }]),
    'ld.habits.u1': JSON.stringify({ '2026-10-01': { water: 5 } }),
    'ld.orders.u2': JSON.stringify([{ id: 'other person' }]),
    'ld.basket': JSON.stringify({ ugu: 2 }),
    'ld.language': 'en',
  })

  it('collects only this person\'s data, plus device data', () => {
    const data = collectData('u1', store)
    expect(data.healthChecks).toEqual([{ id: 'hc1' }])
    expect(data.habits['2026-10-01'].water).toBe(5)
    expect(data.orders).toBeUndefined()
    expect(data.basket).toEqual({ ugu: 2 })
    expect(data.language).toBe('en')
  })

  it('labels the export with the account', () => {
    const out = buildExport({ id: 'u1', phone: '+2348012345678', user_metadata: { first_name: 'Ada' } }, store)
    expect(out.account.firstName).toBe('Ada')
    expect(out.service).toBe('Living Dose')
    expect(out.data.healthChecks).toHaveLength(1)
  })
})

describe('delete my data', () => {
  it('removes this person\'s data and leaves others alone', () => {
    const store = memoryStorage({ 'ld.hc.results.u1': '[]', 'ld.diary.u1': '[]', 'ld.orders.u2': '[]', 'ld.basket': '{}' })
    const removed = deleteLocalData('u1', store)
    expect(removed).toBe(3)
    expect(store.keys()).toEqual(['ld.orders.u2'])
  })
})

describe('household and notifications', () => {
  it('validates members', () => {
    expect(validateMember({ name: '', relationship: 'child', ageGroup: 'child' }).name).toBe('required')
    expect(validateMember({ name: 'Tobi', relationship: 'x', ageGroup: 'child' }).relationship).toBe('required')
    expect(validateMember({ name: 'Tobi', relationship: 'child', ageGroup: 'child' })).toEqual({})
  })

  it('keeps consultation reminders on and needs a channel', () => {
    expect(DEFAULT_NOTIFICATIONS.consultations).toBe(true)
    expect(hasChannel(DEFAULT_NOTIFICATIONS)).toBe(true)
    expect(hasChannel({ channels: { push: false, sms: false } })).toBe(false)
  })
})

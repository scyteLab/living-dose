import { describe, expect, it, vi } from 'vitest'
import { createSyncEngine, decide } from './engine'
import { keepLocalPhotos, stripPhotos } from './registry'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), map }
}

/** A pretend server with a clock that moves on with every write. */
function fakeServer(rows = {}) {
  let clock = 100
  const store = new Map(Object.entries(rows).map(([k, d]) => [k, { kind: k, data: d, updated_at: `t${clock++}` }]))
  return {
    store,
    list: vi.fn(async () => [...store.values()]),
    put: vi.fn(async (kind, data) => {
      const row = { kind, data, updated_at: `t${clock++}` }
      store.set(kind, row)
      return { updated_at: row.updated_at }
    }),
  }
}

describe('deciding what to do', () => {
  it('uploads data the server does not have', () => expect(decide(undefined, undefined, true)).toBe('push'))
  it('downloads data this device does not have', () => expect(decide(undefined, { updated_at: 't5' }, false)).toBe('pull'))
  it('keeps a backup the first time both have data', () => expect(decide(undefined, { updated_at: 't5' }, true)).toBe('pull-keep-backup'))
  it('downloads newer server data', () => expect(decide({ syncedAt: 't1', dirty: false }, { updated_at: 't5' }, true)).toBe('pull'))
  it('uploads local changes', () => expect(decide({ syncedAt: 't5', dirty: true, changedAt: 't6' }, { updated_at: 't5' }, true)).toBe('push'))
  it('does nothing when in step', () => expect(decide({ syncedAt: 't5', dirty: false }, { updated_at: 't5' }, true)).toBe('none'))
  it('lets the most recent change win when both changed', () => {
    expect(decide({ syncedAt: 't1', dirty: true, changedAt: 't9' }, { updated_at: 't5' }, true)).toBe('push')
    expect(decide({ syncedAt: 't1', dirty: true, changedAt: 't3' }, { updated_at: 't5' }, true)).toBe('pull-keep-backup')
  })
})

describe('two devices', () => {
  it('a meal plan made on the phone appears on the laptop', async () => {
    const server = fakeServer()
    const phone = memoryStorage({ 'ld.plan.u1': JSON.stringify({ weeks: { a: 1 } }) })
    const laptop = memoryStorage()
    await createSyncEngine({ userId: 'u1', storage: phone, api: server }).syncAll()
    const applied = vi.fn()
    const result = await createSyncEngine({ userId: 'u1', storage: laptop, api: server, onApplied: applied }).syncAll()
    expect(JSON.parse(laptop.getItem('ld.plan.u1'))).toEqual({ weeks: { a: 1 } })
    expect(result.pulled).toBe(1)
    expect(applied).toHaveBeenCalled()
  })

  it('a change is uploaded shortly after it happens', async () => {
    vi.useFakeTimers()
    const server = fakeServer()
    const phone = memoryStorage()
    const engine = createSyncEngine({ userId: 'u1', storage: phone, api: server, delay: 1000 })
    phone.setItem('ld.habits.u1', JSON.stringify({ '2026-10-01': { water: 3 } }))
    engine.noteWrite('ld.habits.u1')
    engine.noteWrite('ld.cart') // not personal synced data: ignored
    await vi.advanceTimersByTimeAsync(1100)
    expect(server.put).toHaveBeenCalledTimes(1)
    expect(server.store.get('habits').data['2026-10-01'].water).toBe(3)
    vi.useRealTimers()
  })

  it('does not re-upload what it just downloaded', async () => {
    const server = fakeServer({ habits: { d: 1 } })
    const laptop = memoryStorage()
    const engine = createSyncEngine({ userId: 'u1', storage: laptop, api: server })
    const original = laptop.setItem
    laptop.setItem = (k, v) => (original(k, v), engine.noteWrite(k)) // like the provider's watcher
    await engine.syncAll()
    expect(server.put).not.toHaveBeenCalled()
    expect(JSON.parse(laptop.getItem('ld.sync.u1')).habits.dirty).toBe(false)
  })

  it('keeps the device\'s copy as a backup when both had different data', async () => {
    const server = fakeServer({ household: [{ name: 'Tobi' }] })
    const tablet = memoryStorage({ 'ld.household.u1': JSON.stringify([{ name: 'Mama' }]) })
    await createSyncEngine({ userId: 'u1', storage: tablet, api: server }).syncAll()
    expect(JSON.parse(tablet.getItem('ld.household.u1'))).toEqual([{ name: 'Tobi' }])
    expect(JSON.parse(tablet.getItem('ld.sync.backup.household.u1'))).toEqual([{ name: 'Mama' }])
  })

  it('only syncs the signed-in member\'s own data', async () => {
    const server = fakeServer()
    const shared = memoryStorage({ 'ld.plan.u1': '{"a":1}', 'ld.plan.u2': '{"b":2}' })
    await createSyncEngine({ userId: 'u1', storage: shared, api: server }).syncAll()
    expect(server.store.get('mealPlan').data).toEqual({ a: 1 })
    expect(JSON.stringify([...server.store.values()])).not.toContain('"b":2')
  })
})

describe('meal photos', () => {
  it('stay on the device when the diary is uploaded', () => {
    const up = stripPhotos([{ id: 'm1', photo: 'data:image/jpeg;base64,AAAA', items: [] }])
    expect(up[0].photo).toBeNull()
    expect(up[0].hadPhoto).toBe(true)
  })

  it('are kept when the diary comes back down', () => {
    const down = keepLocalPhotos([{ id: 'm1', photo: null }, { id: 'm2', photo: null }], [{ id: 'm1', photo: 'data:x' }])
    expect(down.map((e) => e.photo)).toEqual(['data:x', null])
  })
})

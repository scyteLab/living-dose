import { describe, expect, it } from 'vitest'
import { fileReport, hiddenItems, listActivity, listAllAppointments, listAllOrders, listReports, nextStatus, overview, resolveReport, setAppointmentStatus, setOrderStatus } from './api'
import { isStaff } from './access'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]))
  return {
    get length() {
      return map.size
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

const NOW = new Date('2026-10-01T10:00:00Z')
const staff = { name: 'Bola (operations)' }
const seed = () =>
  memoryStorage({
    'ld.orders.u1': [{ id: 'LD-AAA', status: 'placed', total: 12000, createdAt: '2026-10-01T08:00:00Z' }],
    'ld.orders.u2': [
      { id: 'LD-BBB', status: 'packed', total: 30000, createdAt: '2026-09-30T08:00:00Z' },
      { id: 'LD-CCC', status: 'delivered', total: 5000, createdAt: '2026-09-29T08:00:00Z' },
    ],
    'ld.appointments.u1': [{ id: 'LC-1', status: 'booked', start: '2026-10-01T15:00:00Z' }],
    'ld.appointments.u2': [{ id: 'LC-2', status: 'booked', start: '2026-10-05T09:00:00Z' }],
    'ld.basket': { ugu: 1 },
  })

describe('orders', () => {
  it('gathers orders from every member, newest first', () => {
    const orders = listAllOrders(seed())
    expect(orders.map((o) => o.id)).toEqual(['LD-AAA', 'LD-BBB', 'LD-CCC'])
    expect(orders[1].userId).toBe('u2')
  })

  it('moves an order on and records who did it', () => {
    const s = seed()
    expect(nextStatus('placed')).toBe('packed')
    expect(nextStatus('delivered')).toBeNull()
    setOrderStatus(s, staff, 'u1', 'LD-AAA', 'packed')
    const o = listAllOrders(s).find((x) => x.id === 'LD-AAA')
    expect(o.status).toBe('packed')
    expect(o.history.at(-1).by).toBe('Bola (operations)')
    expect(listActivity(s)[0].detail).toBe('LD-AAA → packed')
  })
})

describe('appointments', () => {
  it('lists bookings soonest first and updates them', () => {
    const s = seed()
    expect(listAllAppointments(s).map((a) => a.id)).toEqual(['LC-1', 'LC-2'])
    setAppointmentStatus(s, staff, 'u1', 'LC-1', 'completed')
    expect(listAllAppointments(s)[0].status).toBe('completed')
  })
})

describe('moderation', () => {
  it('settles every report on the same post with one decision, and hides removed posts', () => {
    const s = seed()
    const r1 = fileReport(s, { itemId: 'post-9', kind: 'post', reason: 'spam', body: 'Buy now' })
    fileReport(s, { itemId: 'post-9', kind: 'post', reason: 'harmful', body: 'Buy now' })
    resolveReport(s, staff, r1.id, 'remove')
    expect(listReports(s).every((r) => r.status === 'removed')).toBe(true)
    expect(hiddenItems(s)).toEqual(['post-9'])
  })

  it('keeping a post leaves it visible', () => {
    const s = seed()
    const r = fileReport(s, { itemId: 'post-1', kind: 'post', reason: 'other', body: 'Hello' })
    resolveReport(s, staff, r.id, 'keep')
    expect(hiddenItems(s)).toEqual([])
    expect(listReports(s)[0].status).toBe('kept')
  })
})

describe('overview', () => {
  it('adds up the day', () => {
    const s = seed()
    fileReport(s, { itemId: 'post-2', kind: 'post', reason: 'unkind', body: 'x' })
    const o = overview(s, NOW)
    expect(o.ordersToday).toBe(1)
    expect(o.openOrders).toBe(2)
    expect(o.toPack).toBe(1)
    expect(o.cashDue).toBe(42000)
    expect(o.upcomingAppointments).toBe(2)
    expect(o.next24h).toBe(1)
    expect(o.openReports).toBe(1)
  })
})

describe('access', () => {
  it('trusts only server-set roles outside demo mode', () => {
    expect(isStaff({ app_metadata: { role: 'staff' } })).toBe(true)
    expect(isStaff({ app_metadata: {}, user_metadata: { role: 'staff' } })).toBe(false)
    expect(isStaff(null)).toBe(false)
  })
})

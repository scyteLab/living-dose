/**
 * Staff console data. Today it reads what is stored in this browser (all
 * members who used this device in demo mode). When the server is connected,
 * each function here becomes a Supabase query allowed only for staff
 * (see supabase/migrations/0006_staff.sql). The pages don't need to change.
 */
import { STATUSES } from '@/lib/shop/orders'

const read = (storage, key, fallback) => {
  try {
    return JSON.parse(storage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (storage, key, value) => storage.setItem(key, JSON.stringify(value))

const keysWith = (storage, prefix) => {
  const out = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k?.startsWith(prefix)) out.push(k)
  }
  return out
}

// ---------------------------------------------------------------- activity log

const AUDIT = 'ld.staff.audit'
export function logAction(storage, staff, action, detail) {
  const entry = { at: new Date().toISOString(), staff: staff?.name ?? 'Staff', action, detail }
  write(storage, AUDIT, [entry, ...read(storage, AUDIT, [])].slice(0, 500))
  return entry
}
export const listActivity = (storage) => read(storage, AUDIT, [])

// ---------------------------------------------------------------- orders

export function listAllOrders(storage) {
  return keysWith(storage, 'ld.orders.')
    .flatMap((k) => read(storage, k, []).map((o) => ({ ...o, userId: k.slice('ld.orders.'.length) })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** The next step an order can move to, or null when it's finished. */
export function nextStatus(status) {
  const i = STATUSES.indexOf(status)
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null
}

export function setOrderStatus(storage, staff, userId, orderId, status, extra = {}) {
  const key = `ld.orders.${userId}`
  const orders = read(storage, key, [])
  const order = orders.find((o) => o.id === orderId)
  if (!order) throw new Error('not-found')
  // Same rule as the server: a "pay now" order isn't packed until it's paid
  if (status !== 'cancelled' && order.payment === 'paystack' && order.paymentStatus !== 'paid') throw new Error('awaiting-payment')
  if (status === 'delivered' && order.payment !== 'paystack') extra = { ...extra, paymentStatus: 'paid' }
  const history = [...(order.history ?? [{ status: order.status, at: order.createdAt }]), { status, at: new Date().toISOString(), by: staff?.name }]
  write(storage, key, orders.map((o) => (o.id === orderId ? { ...o, ...extra, status, history } : o)))
  logAction(storage, staff, 'order.status', `${orderId} → ${status}`)
}

// ---------------------------------------------------------------- appointments

export function listAllAppointments(storage) {
  return keysWith(storage, 'ld.appointments.')
    .flatMap((k) => read(storage, k, []).map((a) => ({ ...a, userId: k.slice('ld.appointments.'.length) })))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function setAppointmentStatus(storage, staff, userId, id, status) {
  const key = `ld.appointments.${userId}`
  write(storage, key, read(storage, key, []).map((a) => (a.id === id ? { ...a, status } : a)))
  logAction(storage, staff, 'appointment.status', `${id} → ${status}`)
}

// ---------------------------------------------------------------- moderation

const QUEUE = 'ld.moderation'
const HIDDEN = 'ld.moderation.hidden'

/** Called when a member reports a post or reply. */
export function fileReport(storage, report) {
  const item = { id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, status: 'open', createdAt: new Date().toISOString(), ...report }
  write(storage, QUEUE, [item, ...read(storage, QUEUE, [])].slice(0, 500))
  return item
}

export const listReports = (storage) => read(storage, QUEUE, [])
export const hiddenItems = (storage) => read(storage, HIDDEN, [])

/** remove: hide the post for everyone. keep: close the report, leave the post. */
export function resolveReport(storage, staff, reportId, decision) {
  const queue = read(storage, QUEUE, [])
  const report = queue.find((r) => r.id === reportId)
  if (!report) return
  // Every open report on the same item is settled by one decision
  write(storage, QUEUE, queue.map((r) => (r.itemId === report.itemId && r.status === 'open' ? { ...r, status: decision === 'remove' ? 'removed' : 'kept', resolvedAt: new Date().toISOString() } : r)))
  if (decision === 'remove') write(storage, HIDDEN, [...new Set([...read(storage, HIDDEN, []), report.itemId])])
  logAction(storage, staff, `moderation.${decision}`, `${report.kind} ${report.itemId} (${report.reason})`)
}

// ---------------------------------------------------------------- overview

export function overview(storage, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const orders = listAllOrders(storage)
  const open = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  const appts = listAllAppointments(storage).filter((a) => a.status === 'booked' && new Date(a.start) >= now)
  return {
    ordersToday: orders.filter((o) => o.createdAt.slice(0, 10) === today).length,
    openOrders: open.length,
    toPack: open.filter((o) => o.status === 'placed').length,
    cashDue: open.reduce((sum, o) => sum + o.total, 0),
    upcomingAppointments: appts.length,
    next24h: appts.filter((a) => new Date(a.start) - now < 864e5).length,
    openReports: new Set(listReports(storage).filter((r) => r.status === 'open').map((r) => r.itemId)).size,
  }
}

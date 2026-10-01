import { basketTotals } from './cart'

/**
 * Orders are kept on this device for now. The Supabase tables are ready in
 * supabase/migrations/0003_orders.sql for when orders move to the server.
 */
const key = (userId) => `ld.orders.${userId}`

const read = (userId) => {
  try {
    return JSON.parse(window.localStorage.getItem(key(userId))) ?? []
  } catch {
    return []
  }
}

export const STATUSES = ['placed', 'packed', 'onTheWay', 'delivered']

function newOrderNumber() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I, easier to read out on the phone
  let code = ''
  for (let i = 0; i < 6; i++) code += letters[Math.floor(Math.random() * letters.length)]
  return `LD-${code}`
}

export async function placeOrder(userId, { basket, address, slot, payment, note }) {
  const totals = basketTotals(basket)
  if (totals.itemCount === 0) throw new Error('empty')
  const order = {
    id: newOrderNumber(),
    createdAt: new Date().toISOString(),
    status: 'placed',
    items: totals.lines.map((l) => ({ productId: l.product.id, name: l.product.name, unit: l.product.unit, price: l.product.price, qty: l.qty })),
    subtotal: totals.subtotal,
    delivery: totals.delivery,
    total: totals.total,
    address,
    slot,
    payment,
    note: note?.trim() || null,
  }
  const orders = [order, ...read(userId)].slice(0, 50)
  window.localStorage.setItem(key(userId), JSON.stringify(orders))
  return order
}

export const listOrders = async (userId) => read(userId)
export const getOrder = async (userId, id) => read(userId).find((o) => o.id === id) ?? null

/** Delivery windows from tomorrow for the next few days. */
export function deliverySlots({ days = 5, slots = ['morning', 'afternoon', 'evening'], from = new Date() } = {}) {
  const out = []
  for (let d = 1; d <= days; d++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + d)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    out.push({ date: iso, slots: slots.map((s) => ({ id: `${iso}|${s}`, window: s })) })
  }
  return out
}

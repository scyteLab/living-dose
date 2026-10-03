import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'
import { basketTotals } from './cart'

/**
 * Orders. With Supabase configured they're placed through the secure
 * place_order() function, which works out every price on the server
 * (supabase/migrations/0009_secure_shop_and_care.sql). In demo mode they're
 * kept on this device.
 */
const remote = isSupabaseConfigured

/** A row from the orders table (with its order_items) in the app's shape. */
export function orderFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    status: row.status,
    items: (row.order_items ?? []).map((i) => ({ productId: i.product_id, name: i.name, unit: i.unit, price: i.price, qty: i.qty })),
    subtotal: row.subtotal,
    delivery: row.delivery,
    total: row.total,
    address: row.address,
    slot: row.slot,
    payment: row.payment,
    note: row.note,
    paid: Boolean(row.paid),
    history: (row.history ?? []).map((h) => ({ status: h.status, at: h.at })),
  }
}
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
  if (remote) {
    // Only product IDs and quantities are sent. The server sets every price.
    const placed = unwrap(
      await supabase.rpc('place_order', {
        p_items: totals.lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        p_address: address,
        p_slot: slot,
        p_note: note?.trim() || null,
      }),
    )
    return (await getOrder(userId, placed.id)) ?? { id: placed.id }
  }
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

export async function listOrders(userId) {
  if (!remote) return read(userId)
  const rows = unwrap(await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(50))
  return rows.map(orderFromRow)
}

export async function getOrder(userId, id) {
  if (!remote) return read(userId).find((o) => o.id === id) ?? null
  const row = unwrap(await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle())
  return row ? orderFromRow(row) : null
}

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

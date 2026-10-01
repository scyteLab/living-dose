import { shop } from '@/config/shop'
import { PRODUCTS_BY_ID } from '@/data/products'

/**
 * Basket maths as pure functions. A basket is { [productId]: quantity }.
 * Unknown products (e.g. removed from the catalogue) are ignored.
 */
export const clampQty = (qty) => Math.max(0, Math.min(shop.maxQuantity, Math.round(qty)))

export function setQuantity(basket, productId, qty) {
  const next = { ...basket }
  const q = clampQty(qty)
  if (q === 0) delete next[productId]
  else next[productId] = q
  return next
}

export const addToBasket = (basket, productId, qty = 1) => setQuantity(basket, productId, (basket[productId] ?? 0) + qty)

export function basketLines(basket) {
  return Object.entries(basket)
    .filter(([id]) => PRODUCTS_BY_ID[id])
    .map(([id, qty]) => ({ product: PRODUCTS_BY_ID[id], qty, total: PRODUCTS_BY_ID[id].price * qty }))
}

export function basketTotals(basket) {
  const lines = basketLines(basket)
  const itemCount = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.total, 0)
  const free = subtotal >= shop.freeDeliveryFrom
  const delivery = subtotal === 0 || free ? 0 : shop.deliveryFee
  return {
    lines,
    itemCount,
    subtotal,
    delivery,
    total: subtotal + delivery,
    freeDelivery: free,
    toFreeDelivery: free ? 0 : Math.max(0, shop.freeDeliveryFrom - subtotal),
  }
}

import { describe, expect, it } from 'vitest'
import { shop } from '@/config/shop'
import { PRODUCTS, PRODUCTS_BY_ID } from '@/data/products'
import { RECIPES } from '@/data/recipes'
import { dailyTargets } from '@/lib/mealPlan/targets'
import { generatePlan } from '@/lib/mealPlan/generate'
import { addToBasket, basketTotals, setQuantity } from './cart'
import { deliverySlots } from './orders'
import { productsForPlan } from './planToBasket'

describe('catalogue', () => {
  it('has unique ids, prices and categories', () => {
    const ids = new Set(PRODUCTS.map((p) => p.id))
    expect(ids.size).toBe(PRODUCTS.length)
    PRODUCTS.forEach((p) => {
      expect(p.price).toBeGreaterThan(0)
      expect(Number.isInteger(p.price)).toBe(true)
    })
  })

  it('stocks something for every recipe ingredient', () => {
    const ingredientIds = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)))
    const covered = [...ingredientIds].filter((id) => PRODUCTS.some((p) => p.ingredientIds.includes(id)))
    expect(covered.length).toBe(ingredientIds.size)
  })
})

describe('basket', () => {
  it('adds, updates and removes', () => {
    let b = addToBasket({}, 'ugu')
    b = addToBasket(b, 'ugu', 2)
    expect(b.ugu).toBe(3)
    b = setQuantity(b, 'ugu', 0)
    expect(b.ugu).toBeUndefined()
  })

  it('caps quantities', () => {
    expect(setQuantity({}, 'ugu', 999).ugu).toBe(shop.maxQuantity)
  })

  it('charges delivery below the free threshold, and not above it', () => {
    const small = basketTotals({ ugu: 2 })
    expect(small.subtotal).toBe(PRODUCTS_BY_ID.ugu.price * 2)
    expect(small.delivery).toBe(shop.deliveryFee)
    expect(small.total).toBe(small.subtotal + shop.deliveryFee)
    const big = basketTotals({ 'pack-diabetic': 2 })
    expect(big.delivery).toBe(0)
    expect(big.freeDelivery).toBe(true)
  })

  it('charges nothing for an empty basket and ignores unknown products', () => {
    expect(basketTotals({}).total).toBe(0)
    expect(basketTotals({ 'no-such-thing': 3 }).itemCount).toBe(0)
  })
})

describe('meal plan to basket', () => {
  it('finds products for this week\'s plan', () => {
    const targets = dailyTargets(null)
    const plan = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets })
    const { products } = productsForPlan(plan.days, 1)
    expect(products.length).toBeGreaterThan(8)
    products.forEach((p) => expect(PRODUCTS_BY_ID[p.productId]).toBeTruthy())
  })
})

describe('delivery slots', () => {
  it('starts tomorrow', () => {
    const days = deliverySlots({ days: 3, from: new Date(2026, 8, 30) })
    expect(days[0].date).toBe('2026-10-01')
    expect(days).toHaveLength(3)
    expect(days[0].slots).toHaveLength(3)
  })
})

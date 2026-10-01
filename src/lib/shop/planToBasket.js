import { PRODUCTS } from '@/data/products'
import { buildShoppingList } from '@/lib/mealPlan/shoppingList'

/**
 * Products that cover a meal plan's shopping list.
 * Returns [{ productId, qty, forIngredients: [names] }] and the ingredients no product covers.
 */
export function productsForPlan(days, household = 1) {
  const items = buildShoppingList(days, household).flatMap((g) => g.items)
  const matched = new Map()
  const missing = []
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.ingredientIds.includes(item.id))
    if (!product) {
      missing.push(item.name)
      continue
    }
    const entry = matched.get(product.id) ?? { productId: product.id, qty: 1, forIngredients: [] }
    entry.forIngredients.push(item.name)
    matched.set(product.id, entry)
  }
  // Bigger households usually need more of the fresh, quick-to-use items
  const extra = household >= 4 ? 1 : 0
  return {
    products: [...matched.values()].map((m) => {
      const p = PRODUCTS.find((x) => x.id === m.productId)
      return { ...m, qty: m.qty + (p.category === 'produce' ? extra : 0) }
    }),
    missing,
  }
}

import { RECIPES_BY_ID } from '@/data/recipes'

export const AISLES = ['produce', 'protein', 'grains', 'dairy', 'pantry']

/** Nicely rounded amounts: 1,250 g → 1.3 kg, 3.25 eggs → 4. */
export function formatQty(qty, unit) {
  if (unit === 'g') return qty >= 1000 ? { qty: Math.round(qty / 100) / 10, unit: 'kg' } : { qty: Math.ceil(qty / 10) * 10, unit: 'g' }
  if (unit === 'ml') return qty >= 1000 ? { qty: Math.round(qty / 100) / 10, unit: 'l' } : { qty: Math.ceil(qty / 10) * 10, unit: 'ml' }
  return { qty: Math.ceil(qty), unit }
}

/**
 * Everything needed for the week, grouped by shop aisle.
 * Quantities = per-serving amount × portion × people in the household.
 */
export function buildShoppingList(days, household = 1) {
  const items = {}
  for (const day of days) {
    for (const meal of Object.values(day.meals)) {
      if (!meal) continue
      const recipe = RECIPES_BY_ID[meal.recipeId]
      if (!recipe) continue
      for (const ing of recipe.ingredients) {
        const key = `${ing.id}|${ing.unit}`
        items[key] ??= { id: ing.id, name: ing.name, unit: ing.unit, aisle: ing.aisle, qty: 0 }
        items[key].qty += ing.qty * meal.portion * household
      }
    }
  }
  return AISLES.map((aisle) => ({
    aisle,
    items: Object.values(items)
      .filter((it) => it.aisle === aisle)
      .map((it) => ({ ...it, ...formatQty(it.qty, it.unit), key: `${it.id}|${it.unit}` }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0)
}

/**
 * Works out a recipe's nutrition, tags, cost level and allergens from its
 * ingredients and the ingredient table, so every number can be traced back
 * to one row of src/data/ingredients.js.
 */
import { INGREDIENTS_BY_ID } from '@/data/ingredients'

const OIL_DENSITY = 0.92

/** Grams of one recipe ingredient (per serving). */
export function gramsOf(item) {
  const ing = INGREDIENTS_BY_ID[item.id]
  if (!ing) throw new Error(`Unknown ingredient: ${item.id}`)
  if (item.unit === 'g') return item.qty
  if (item.unit === 'ml') return item.qty * (ing.fat >= 99 ? OIL_DENSITY : 1)
  return item.qty * (ing.pieceG ?? 0)
}

const round = (x, step = 1) => Number((Math.round(x / step) * step).toFixed(step < 1 ? 1 : 0))

/** Nutrition per serving: kcal, protein, carbs, fat, fibre, salt, sat, veg portions. */
export function nutritionOf(ingredients) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, salt: 0, sat: 0, veg: 0, refined: 0 }
  for (const item of ingredients) {
    const ing = INGREDIENTS_BY_ID[item.id]
    const g = gramsOf(item)
    const k = g / 100
    t.kcal += ing.kcal * k
    t.protein += ing.protein * k
    t.carbs += ing.carbs * k
    t.fat += ing.fat * k
    t.fibre += ing.fibre * k
    t.salt += ing.salt * k
    t.sat += ing.sat * k
    if (ing.veg) t.veg += g
    if (ing.refined) t.refined += g
  }
  return {
    kcal: round(t.kcal, 5),
    protein: round(t.protein),
    carbs: round(t.carbs),
    fat: round(t.fat),
    fibre: round(t.fibre),
    salt: round(t.salt, 0.1),
    sat: round(t.sat, 0.5),
    veg: Math.min(3, round(t.veg / 80, 0.5)),
    refinedG: round(t.refined),
  }
}

/**
 * Tags from the numbers (per serving):
 *   diabetic  fibre 6 g+ (snacks 3 g+), refined starch 40 g or less, carbs 65 g or less (snacks 25 g)
 *   heart     salt 1.2 g or less, saturated fat 6 g or less, fat 25 g or less
 *   protein   25 g+ for lunch and dinner, 15 g+ for breakfast, 8 g+ for snacks
 *   pregnancy no ingredient that's best avoided in pregnancy
 */
export function tagsFor(meal, nut, ingredients) {
  const tags = []
  const snack = meal === 'snack'
  if (nut.fibre >= (snack ? 3 : 6) && nut.refinedG <= 40 && nut.carbs <= (snack ? 25 : 65)) tags.push('diabetic')
  if (nut.salt <= 1.2 && nut.sat <= 6 && nut.fat <= 25) tags.push('heart')
  if (nut.protein >= (meal === 'lunch' || meal === 'dinner' ? 25 : meal === 'breakfast' ? 15 : 8)) tags.push('protein')
  if (!ingredients.some((i) => INGREDIENTS_BY_ID[i.id].avoidPregnancy)) tags.push('pregnancy')
  return tags
}

/** Cost level: the dearest ingredient that's a real part of the dish (30 g or more). */
export function costOf(ingredients) {
  return Math.max(1, ...ingredients.filter((i) => gramsOf(i) >= 30).map((i) => INGREDIENTS_BY_ID[i.id].cost))
}

export function containsOf(ingredients) {
  return [...new Set(ingredients.map((i) => INGREDIENTS_BY_ID[i.id].contains).filter(Boolean))]
}

/** A recipe ingredient line, with name, unit and aisle from the table. */
export function ing(id, qty, nameOverride) {
  const row = INGREDIENTS_BY_ID[id]
  if (!row) throw new Error(`Unknown ingredient: ${id}`)
  return { id, name: nameOverride ?? row.name, qty, unit: row.unit, aisle: row.aisle }
}

/**
 * A full recipe from its description. Nutrition, tags, allergens and cost are
 * worked out; `tagsAdd`/`tagsRemove` let a dietitian adjust tags by hand.
 */
export function buildRecipe({ tagsAdd = [], tagsRemove = [], ...r }) {
  const nut = nutritionOf(r.ingredients)
  const tags = [...new Set([...tagsFor(r.meal, nut, r.ingredients), ...tagsAdd])].filter((t) => !tagsRemove.includes(t))
  const { refinedG: _refined, ...shown } = nut
  return { ...r, ...shown, tags, contains: containsOf(r.ingredients), cost: r.cost ?? costOf(r.ingredients), computed: true }
}

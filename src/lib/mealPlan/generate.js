/**
 * Builds a 7-day plan from the recipe library.
 *
 * Hard rules: never include something the person avoids; in pregnancy only
 * pregnancy-suitable recipes. Soft preferences (weighted): recipes that match the
 * health focus, the budget level, and variety: no meal twice in a week while
 * there are others to choose from, and the base (rice, swallow, beans, yam…)
 * changes from day to day and between lunch and dinner.
 * "Shuffle my week" passes a new `shuffle` number for a fresh, equally healthy week.
 * Portions are sized so each meal meets its share of the daily energy target.
 * The same person and week always get the same plan (seeded), until settings change.
 */
import { RECIPES, RECIPES_BY_ID } from '@/data/recipes'

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']
const SHARE_WITH_SNACK = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }
const SHARE_NO_SNACK = { breakfast: 0.28, lunch: 0.38, dinner: 0.34 }
const BUDGET_MAX = { low: 1, balanced: 2, flexible: 3 }

export const DEFAULT_SETTINGS = { household: 1, budget: 'balanced', avoid: [], snacks: true }

// ---- deterministic randomness
function hash(str) {
  let h = 2166136261
  for (let k = 0; k < str.length; k++) {
    h ^= str.charCodeAt(k)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The starchy base of a meal, worked out from its ingredients
const BASES = [
  ['rice', ['ofada-rice', 'brown-rice', 'rice']],
  ['swallow', ['garri', 'wheat-flour', 'yam-flour', 'semovita', 'fufu', 'pounded-yam']],
  ['beans', ['beans-brown', 'beans-white']],
  ['yam', ['yam']],
  ['plantain', ['plantain-unripe', 'plantain-ripe']],
  ['potato', ['sweet-potato', 'irish-potato']],
  ['grain', ['oats', 'pap', 'wholewheat-bread', 'corn']],
]
const baseCache = new Map()
/** 'rice' | 'swallow' | 'beans' | 'yam' | 'plantain' | 'potato' | 'grain' | 'light' */
export function baseOf(recipe) {
  if (!recipe) return null
  if (!baseCache.has(recipe.id)) {
    const ids = recipe.ingredients.map((x) => x.id)
    baseCache.set(recipe.id, BASES.find(([, list]) => list.some((x) => ids.includes(x)))?.[0] ?? 'light')
  }
  return baseCache.get(recipe.id)
}

/** Recipes allowed at all for this person, for one meal slot. */
export function eligible(slot, settings, focus) {
  return RECIPES.filter((r) => r.meal === slot && !r.contains.some((c) => settings.avoid.includes(c)) && (!focus.pregnancy || r.tags.includes('pregnancy')))
}

/** How well a recipe suits this person right now (higher is better). */
function suitability(r, settings, focus) {
  let s = 0
  if (focus.diabetic) s += r.tags.includes('diabetic') ? 3 : -2
  if (focus.heart) s += r.tags.includes('heart') ? 3 : r.salt > 1.5 ? -2 : 0
  if (focus.lose) s += r.fibre >= 6 ? 1 : 0
  s += r.veg * 0.6 + r.fibre * 0.08
  const over = r.cost - BUDGET_MAX[settings.budget]
  if (over > 0) s -= over * 3
  return s
}

/** Portion so the meal meets its share of the day, in quarter steps between ¾ and 1½. */
export function portionFor(recipe, slot, kcal, snacks) {
  const share = (snacks ? SHARE_WITH_SNACK : SHARE_NO_SNACK)[slot]
  const ideal = (kcal * share) / recipe.kcal
  return Math.min(1.5, Math.max(0.75, Math.round(ideal * 4) / 4))
}

export function generatePlan({ seed, weekStart, settings = DEFAULT_SETTINGS, targets, shuffle = 0 }) {
  const random = rng(`${seed}:${weekStart}:${JSON.stringify(settings)}${shuffle ? `:${shuffle}` : ''}`)
  const focus = targets.focus
  const slots = settings.snacks ? SLOTS : SLOTS.slice(0, 3)
  const recent = Object.fromEntries(slots.map((s) => [s, []]))
  const lastBase = {}
  const counts = {}

  const days = Array.from({ length: 7 }, () => {
    const meals = {}
    const basesToday = []
    for (const slot of slots) {
      const pool = eligible(slot, settings, focus)
      if (pool.length === 0) {
        meals[slot] = null
        continue
      }
      const scored = pool.map((r) => {
        let score = suitability(r, settings, focus) + random() * 2.5
        const used = counts[r.id] ?? 0
        if (recent[slot].slice(-2).includes(r.id)) score -= 10 // never two days running
        // Once in a week is enough while there are other choices (batch dishes may come back once)
        if (used >= (r.batch ? 2 : 1)) score -= 4.5 * used
        const base = baseOf(r)
        if (base !== 'light') {
          if (lastBase[slot] === base) score -= 2.5 // a different base from yesterday
          if (slot !== 'snack' && basesToday.includes(base)) score -= 3 // not rice for lunch and dinner
        }
        return { r, score }
      })
      scored.sort((x, y) => y.score - x.score)
      const pick = scored[0].r
      recent[slot].push(pick.id)
      counts[pick.id] = (counts[pick.id] ?? 0) + 1
      lastBase[slot] = baseOf(pick)
      basesToday.push(baseOf(pick))
      meals[slot] = { recipeId: pick.id, portion: portionFor(pick, slot, targets.kcal, settings.snacks) }
    }
    return { meals }
  })

  return { weekStart, settings, kcal: targets.kcal, days }
}

/** How many times each recipe appears in a week's days. */
export function weekCounts(days) {
  const counts = {}
  for (const day of days) for (const m of Object.values(day.meals)) if (m) counts[m.recipeId] = (counts[m.recipeId] ?? 0) + 1
  return counts
}

/** Different meals in the week, and how many meals in all. */
export function varietyOf(days) {
  const counts = weekCounts(days)
  return { different: Object.keys(counts).length, total: Object.values(counts).reduce((a, b) => a + b, 0) }
}

/**
 * Other recipes that could replace a meal, best first. With the week's counts,
 * meals not yet in the week come first, then a different base from the current one.
 */
export function alternatives({ slot, currentId, settings, targets, counts = {}, limit = 5 }) {
  const currentBase = baseOf(RECIPES_BY_ID[currentId])
  return eligible(slot, settings, targets.focus)
    .filter((r) => r.id !== currentId)
    .map((r) => {
      const inWeek = counts[r.id] ?? 0
      let score = suitability(r, settings, targets.focus) - inWeek * 4
      if (currentBase && currentBase !== 'light' && baseOf(r) === currentBase) score -= 1.5
      return { r, score, inWeek }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ r, inWeek }) => ({ ...r, inWeek }))
}

/** Nutrition for one day's meals, portions included. */
export function dayTotals(meals) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, salt: 0, veg: 0 }
  for (const m of Object.values(meals)) {
    if (!m) continue
    const r = RECIPES_BY_ID[m.recipeId]
    if (!r) continue
    for (const k of Object.keys(total)) total[k] += r[k] * m.portion
  }
  return {
    kcal: Math.round(total.kcal),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
    fibre: Math.round(total.fibre),
    salt: Math.round(total.salt * 10) / 10,
    veg: Math.round(total.veg * 2) / 2,
  }
}

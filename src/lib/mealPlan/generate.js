/**
 * Builds a 7-day plan from the recipe library.
 *
 * Hard rules: never include something the person avoids; in pregnancy only
 * pregnancy-suitable recipes. Soft preferences (weighted): recipes that match the
 * health focus, the budget level, and variety (no repeats on consecutive days).
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

/** Recipes allowed at all for this person, for one meal slot. */
export function eligible(slot, settings, focus) {
  return RECIPES.filter(
    (r) =>
      r.meal === slot &&
      !r.contains.some((c) => settings.avoid.includes(c)) &&
      (!focus.pregnancy || r.tags.includes('pregnancy')),
  )
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

export function generatePlan({ seed, weekStart, settings = DEFAULT_SETTINGS, targets }) {
  const random = rng(`${seed}:${weekStart}:${JSON.stringify(settings)}`)
  const focus = targets.focus
  const slots = settings.snacks ? SLOTS : SLOTS.slice(0, 3)
  const recent = Object.fromEntries(slots.map((s) => [s, []]))
  const counts = {}

  const days = Array.from({ length: 7 }, () => {
    const meals = {}
    for (const slot of slots) {
      const pool = eligible(slot, settings, focus)
      if (pool.length === 0) {
        meals[slot] = null
        continue
      }
      const scored = pool.map((r) => {
        let score = suitability(r, settings, focus) + random() * 2.5
        if (recent[slot].slice(-2).includes(r.id)) score -= 6 // not two days running
        const limit = r.batch ? 3 : 2
        if ((counts[r.id] ?? 0) >= limit) score -= 8
        return { r, score }
      })
      scored.sort((x, y) => y.score - x.score)
      const pick = scored[0].r
      recent[slot].push(pick.id)
      counts[pick.id] = (counts[pick.id] ?? 0) + 1
      meals[slot] = { recipeId: pick.id, portion: portionFor(pick, slot, targets.kcal, settings.snacks) }
    }
    return { meals }
  })

  return { weekStart, settings, kcal: targets.kcal, days }
}

/** Other recipes that could replace a meal, best first. */
export function alternatives({ slot, currentId, settings, targets, limit = 5 }) {
  return eligible(slot, settings, targets.focus)
    .filter((r) => r.id !== currentId)
    .map((r) => ({ r, score: suitability(r, settings, targets.focus) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ r }) => r)
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

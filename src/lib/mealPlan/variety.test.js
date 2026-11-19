import { describe, expect, it } from 'vitest'
import { RECIPES_BY_ID } from '@/data/recipes'
import { DEFAULT_SETTINGS, alternatives, baseOf, generatePlan, varietyOf, weekCounts } from './generate'

const targets = { kcal: 2000, focus: {} }
const plan = (extra = {}) => generatePlan({ seed: 'member-1', weekStart: '2026-11-16', settings: DEFAULT_SETTINGS, targets, ...extra })

describe('variety in the meal plan', () => {
  it('knows the base of a meal', () => {
    expect(baseOf(RECIPES_BY_ID['jollof-chicken-salad'])).toBe('rice')
    expect(baseOf(RECIPES_BY_ID['efo-riro-fish-eba'])).toBe('swallow')
    expect(baseOf(RECIPES_BY_ID['beans-plantain'])).toBe('beans')
    expect(baseOf(RECIPES_BY_ID['fish-pepper-soup'])).toBe('light')
  })

  it('avoids repeating a meal in the week when there are enough recipes', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const p = generatePlan({ seed, weekStart: '2026-11-16', settings: DEFAULT_SETTINGS, targets })
      for (const slot of ['breakfast', 'lunch', 'dinner']) {
        const ids = p.days.map((d) => d.meals[slot].recipeId)
        expect(new Set(ids).size).toBeGreaterThanOrEqual(6) // 7 to 9 recipes per meal today
      }
      // Never the same meal two days running
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack']) {
        p.days.slice(1).forEach((d, i) => expect(d.meals[slot].recipeId).not.toBe(p.days[i].meals[slot].recipeId))
      }
    }
  })

  it('rarely serves the same base for lunch and dinner', () => {
    let clashes = 0
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const p = generatePlan({ seed, weekStart: '2026-11-16', settings: DEFAULT_SETTINGS, targets })
      for (const d of p.days) {
        const l = baseOf(RECIPES_BY_ID[d.meals.lunch.recipeId])
        const n = baseOf(RECIPES_BY_ID[d.meals.dinner.recipeId])
        if (l !== 'light' && l === n) clashes++
      }
    }
    expect(clashes).toBeLessThanOrEqual(4) // out of 56 days
  })

  it('gives a different week when shuffled, following the same rules', () => {
    const a = plan()
    const b = plan({ shuffle: 1 })
    const same = a.days.filter((d, i) => d.meals.lunch.recipeId === b.days[i].meals.lunch.recipeId).length
    expect(same).toBeLessThan(7)
    expect(plan({ shuffle: 1 })).toEqual(b) // the same shuffle gives the same week
  })

  it('counts variety', () => {
    const p = plan()
    expect(varietyOf(p.days).different).toBeGreaterThanOrEqual(20)
    expect(varietyOf(p.days).total).toBe(28)
  })

  it('suggests swaps that are new to the week first', () => {
    const p = plan()
    const counts = weekCounts(p.days)
    const options = alternatives({ slot: 'lunch', currentId: p.days[0].meals.lunch.recipeId, settings: DEFAULT_SETTINGS, targets, counts })
    expect(options.length).toBeGreaterThan(0)
    const firstInWeek = options.findIndex((o) => o.inWeek > 0)
    const lastNew = options.map((o) => o.inWeek === 0).lastIndexOf(true)
    if (firstInWeek !== -1 && lastNew !== -1) expect(lastNew).toBeLessThan(firstInWeek + 3)
  })
})

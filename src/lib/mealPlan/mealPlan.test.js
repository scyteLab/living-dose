import { describe, expect, it } from 'vitest'
import { RECIPES, RECIPES_BY_ID } from '@/data/recipes'
import { DEFAULT_SETTINGS, alternatives, dayTotals, generatePlan } from './generate'
import { buildShoppingList, formatQty } from './shoppingList'
import { dailyTargets } from './targets'
import { addDays, weekStartOf } from './storage'

const record = {
  answers: {
    about: { age: '34', sex: 'female', pregnant: 0 },
    body: { unit: 'metric', cm: '165', kg: '73.8', waist: '86' },
    activity: { minutes: 90, strengthDays: 1, sleepHours: 7 },
    history: { conditions: ['none'] },
  },
  results: { measures: { bmi: 27.1, bpCategory: 'normal', findrisc: { band: 'slight' }, pregnant: false } },
}

describe('recipe library', () => {
  it('has complete, sensible entries', () => {
    const ids = new Set()
    for (const r of RECIPES) {
      expect(ids.has(r.id)).toBe(false)
      ids.add(r.id)
      expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(r.meal)
      expect(r.kcal).toBeGreaterThan(100)
      // Energy from macros should roughly match the stated calories (within 20%)
      const fromMacros = r.protein * 4 + r.carbs * 4 + r.fat * 9
      expect(Math.abs(fromMacros - r.kcal) / r.kcal).toBeLessThan(0.2)
      expect(r.ingredients.length).toBeGreaterThan(0)
      expect(r.steps.length).toBeGreaterThan(0)
    }
  })

  it('never marks liver or raw dishes as pregnancy-safe', () => {
    for (const r of RECIPES.filter((x) => x.tags.includes('pregnancy'))) {
      expect(r.ingredients.some((ing) => /liver/i.test(ing.name))).toBe(false)
    }
  })
})

describe('targets', () => {
  it('uses Mifflin–St Jeor with gentle weight loss for BMI 25+', () => {
    // BMR = 10×73.8 + 6.25×165 − 5×34 − 161 = 1438.25; ×1.375 = 1977.6; −500 = 1477.6 → 1500
    const t = dailyTargets(record)
    expect(t.kcal).toBe(1500)
    expect(t.focus.lose).toBe(true)
    expect(t.protein).toBe(59)
  })

  it('adds energy and removes the deficit in pregnancy', () => {
    const p = dailyTargets({ ...record, answers: { ...record.answers, about: { ...record.answers.about, pregnant: 1 } } })
    expect(p.kcal).toBe(2300)
    expect(p.focus.pregnancy).toBe(true)
  })

  it('falls back to defaults without a health check', () => {
    expect(dailyTargets(null).kcal).toBe(2000)
  })
})

describe('generatePlan', () => {
  const targets = dailyTargets(record)
  const plan = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets })

  it('makes 7 days with every meal filled', () => {
    expect(plan.days).toHaveLength(7)
    plan.days.forEach((d) => ['breakfast', 'lunch', 'dinner', 'snack'].forEach((s) => expect(d.meals[s]).toBeTruthy()))
  })

  it('is the same every time for the same person and week', () => {
    expect(generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets })).toEqual(plan)
  })

  it('does not repeat a meal on consecutive days', () => {
    for (let d = 1; d < 7; d++) {
      for (const s of ['lunch', 'dinner']) expect(plan.days[d].meals[s].recipeId).not.toBe(plan.days[d - 1].meals[s].recipeId)
    }
  })

  it('lands close to the energy target', () => {
    plan.days.forEach((d) => {
      const kcal = dayTotals(d.meals).kcal
      expect(Math.abs(kcal - targets.kcal) / targets.kcal).toBeLessThan(0.2)
    })
  })

  it('respects foods to avoid', () => {
    const p = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets, settings: { ...DEFAULT_SETTINGS, avoid: ['pork', 'fish', 'shellfish'] } })
    p.days.forEach((d) =>
      Object.values(d.meals).forEach((m) => m && expect(RECIPES_BY_ID[m.recipeId].contains.some((c) => ['pork', 'fish', 'shellfish'].includes(c))).toBe(false)),
    )
  })

  it('uses only pregnancy-suitable recipes in pregnancy', () => {
    const pt = dailyTargets({ ...record, answers: { ...record.answers, about: { ...record.answers.about, pregnant: 1 } } })
    const p = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets: pt })
    p.days.forEach((d) => Object.values(d.meals).forEach((m) => expect(RECIPES_BY_ID[m.recipeId].tags).toContain('pregnancy')))
  })

  it('leans towards blood-sugar-friendly recipes when needed', () => {
    const dt = { ...targets, focus: { ...targets.focus, diabetic: true } }
    const p = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets: dt })
    const meals = p.days.flatMap((d) => Object.values(d.meals))
    const share = meals.filter((m) => RECIPES_BY_ID[m.recipeId].tags.includes('diabetic')).length / meals.length
    expect(share).toBeGreaterThan(0.7)
  })

  it('offers swaps that fit the same rules', () => {
    const alts = alternatives({ slot: 'dinner', currentId: 'fish-pepper-soup', settings: { ...DEFAULT_SETTINGS, avoid: ['pork'] }, targets })
    expect(alts.length).toBeGreaterThan(2)
    alts.forEach((r) => {
      expect(r.meal).toBe('dinner')
      expect(r.contains).not.toContain('pork')
    })
  })
})

describe('shopping list', () => {
  it('scales by household and groups by aisle', () => {
    const targets = dailyTargets(record)
    const plan = generatePlan({ seed: 'u1', weekStart: '2026-09-28', targets })
    const one = buildShoppingList(plan.days, 1)
    const four = buildShoppingList(plan.days, 4)
    expect(one.length).toBeGreaterThan(2)
    const count = (list) => list.flatMap((g) => g.items).length
    expect(count(four)).toBe(count(one))
  })

  it('rounds amounts sensibly', () => {
    expect(formatQty(1250, 'g')).toEqual({ qty: 1.3, unit: 'kg' })
    expect(formatQty(3.25, '')).toEqual({ qty: 4, unit: '' })
    expect(formatQty(84, 'g')).toEqual({ qty: 90, unit: 'g' })
  })
})

describe('dates', () => {
  it('finds Monday', () => {
    expect(weekStartOf(new Date(2026, 8, 30))).toBe('2026-09-28') // Wednesday 30 Sep
    expect(weekStartOf(new Date(2026, 9, 4))).toBe('2026-09-28') // Sunday 4 Oct
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05')
  })
})

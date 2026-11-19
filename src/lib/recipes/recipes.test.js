import { describe, expect, it } from 'vitest'
import { INGREDIENTS, INGREDIENTS_BY_ID } from '@/data/ingredients'
import { PRODUCTS } from '@/data/products'
import { RECIPES, REGIONS } from '@/data/recipes'
import { buildRecipe, gramsOf, ing, nutritionOf, tagsFor } from './nutrition'

describe('ingredient table', () => {
  it('has sensible values that add up', () => {
    const ids = new Set()
    for (const x of INGREDIENTS) {
      expect(ids.has(x.id)).toBe(false)
      ids.add(x.id)
      for (const k of ['kcal', 'protein', 'carbs', 'fat', 'fibre', 'salt', 'sat']) expect(x[k]).toBeGreaterThanOrEqual(0)
      expect(x.sat).toBeLessThanOrEqual(x.fat)
      expect(x.protein + x.carbs + x.fat + x.fibre).toBeLessThanOrEqual(101)
      if (x.unit === '') expect(x.pieceG).toBeGreaterThan(0)
      // Energy should match protein, carbs, fat and fibre (Atwater factors) within 25%, except near-zero rows
      if (x.kcal > 40) {
        const atwater = x.protein * 4 + x.carbs * 4 + x.fat * 9 + x.fibre * 2
        expect(Math.abs(atwater - x.kcal) / x.kcal, x.id).toBeLessThan(0.25)
      }
    }
  })
})

describe('working out a recipe', () => {
  it('converts grams, millilitres and pieces', () => {
    expect(gramsOf(ing('rice', 70))).toBe(70)
    expect(gramsOf(ing('palm-oil', 10))).toBeCloseTo(9.2)
    expect(gramsOf(ing('milk', 100))).toBe(100)
    expect(gramsOf(ing('egg', 2))).toBe(100)
  })

  it('adds up nutrition and counts vegetables', () => {
    const n = nutritionOf([ing('rice', 100), ing('ugu', 160), ing('salt', 1)])
    expect(n.kcal).toBe(Math.round((360 + 36 * 1.6) / 5) * 5)
    expect(n.salt).toBe(1)
    expect(n.veg).toBe(2)
    expect(n.refinedG).toBe(100)
  })

  it('tags by the numbers', () => {
    const high = { fibre: 8, refinedG: 0, carbs: 50, salt: 1, sat: 3, fat: 12, protein: 30 }
    expect(tagsFor('lunch', high, [ing('beans-brown', 50)])).toEqual(['diabetic', 'heart', 'protein', 'pregnancy'])
    expect(tagsFor('lunch', { ...high, refinedG: 60 }, [ing('garri', 60)])).not.toContain('diabetic')
    expect(tagsFor('lunch', { ...high, salt: 2 }, [ing('rice', 50)])).not.toContain('heart')
    expect(tagsFor('snack', { ...high, protein: 5 }, [ing('hibiscus', 10)])).not.toContain('pregnancy')
  })

  it('lets a dietitian adjust tags by hand', () => {
    const r = buildRecipe({
      id: 'x',
      name: 'X',
      meal: 'lunch',
      region: 'modern',
      minutes: 5,
      ingredients: [ing('rice', 60)],
      steps: ['Cook.'],
      tagsAdd: ['heart'],
      tagsRemove: ['pregnancy'],
    })
    expect(r.tags).toContain('heart')
    expect(r.tags).not.toContain('pregnancy')
  })
})

describe('the recipe library', () => {
  it('is big and covers every meal and region', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(120)
    for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) expect(RECIPES.filter((r) => r.meal === meal).length).toBeGreaterThanOrEqual(20)
    for (const region of REGIONS) expect(RECIPES.filter((r) => r.region === region).length, region).toBeGreaterThanOrEqual(10)
  })

  it('only uses ingredients from the table, with steps and sensible sizes', () => {
    for (const r of RECIPES) {
      for (const i of r.ingredients) expect(INGREDIENTS_BY_ID[i.id], `${r.id}: ${i.id}`).toBeTruthy()
      expect(r.steps.length).toBeGreaterThan(0)
      if (r.meal === 'lunch' || r.meal === 'dinner') expect(r.kcal, r.id).toBeLessThanOrEqual(700)
      if (r.meal !== 'snack') expect(r.salt, r.id).toBeLessThanOrEqual(2)
    }
  })

  it('has plenty of choice for each health focus', () => {
    for (const meal of ['breakfast', 'lunch', 'dinner']) {
      const rs = RECIPES.filter((r) => r.meal === meal)
      expect(rs.filter((r) => r.tags.includes('diabetic')).length, meal).toBeGreaterThanOrEqual(10)
      expect(rs.filter((r) => r.tags.includes('heart')).length, meal).toBeGreaterThanOrEqual(10)
      expect(rs.filter((r) => r.cost === 1).length, meal).toBeGreaterThanOrEqual(5)
    }
  })

  it('meal packs list real recipes', () => {
    for (const p of PRODUCTS.filter((x) => x.recipeIds))
      for (const id of p.recipeIds)
        expect(
          RECIPES.some((r) => r.id === id),
          `${p.id}: ${id}`,
        ).toBe(true)
  })
})

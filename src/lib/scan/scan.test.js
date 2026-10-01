import { describe, expect, it } from 'vitest'
import { FOODS } from '@/data/foods'
import { RECIPES } from '@/data/recipes'
import { searchFoods, slotForTime, totals, trimDiary } from './diary'
import { parseTraceCode, SAMPLE_CODES } from './trace'

describe('foods', () => {
  it('have unique ids and calories that match their macros', () => {
    expect(new Set(FOODS.map((x) => x.id)).size).toBe(FOODS.length)
    FOODS.filter((x) => x.kcal > 40).forEach((x) => {
      const fromMacros = x.protein * 4 + x.carbs * 4 + x.fat * 9
      expect(Math.abs(fromMacros - x.kcal) / x.kcal).toBeLessThan(0.2)
    })
  })
})

describe('diary maths', () => {
  it('adds up items with portions', () => {
    const t = totals([
      { source: 'food', id: 'jollof-rice', portion: 1 },
      { source: 'food', id: 'grilled-chicken', portion: 1.5 },
      { source: 'recipe', id: 'orange-groundnuts', portion: 1 },
    ])
    expect(t.kcal).toBe(Math.round(350 + 250 * 1.5 + 220))
    expect(t.veg).toBe(1.5)
  })

  it('ignores unknown items', () => {
    expect(totals([{ source: 'food', id: 'nope', portion: 1 }]).kcal).toBe(0)
  })

  it('guesses the meal from the time', () => {
    expect(slotForTime(new Date(2026, 9, 1, 8))).toBe('breakfast')
    expect(slotForTime(new Date(2026, 9, 1, 13))).toBe('lunch')
    expect(slotForTime(new Date(2026, 9, 1, 16))).toBe('snack')
    expect(slotForTime(new Date(2026, 9, 1, 20))).toBe('dinner')
  })

  it('searches foods and recipes', () => {
    const hits = searchFoods('rice', { foods: FOODS, recipes: RECIPES })
    expect(hits.some((h) => h.source === 'food')).toBe(true)
    expect(hits.some((h) => h.source === 'recipe')).toBe(true)
    expect(searchFoods('', { foods: FOODS, recipes: RECIPES })).toEqual([])
  })

  it('keeps photos for the newest 20 entries and drops old days', () => {
    const today = new Date(2026, 9, 1)
    const entries = Array.from({ length: 25 }, (_, i) => ({ id: `e${i}`, date: '2026-10-01', time: `2026-10-01T${String(i).padStart(2, '0')}:00`, photo: 'x', items: [] }))
    entries.push({ id: 'old', date: '2026-06-01', time: '2026-06-01T10:00', photo: 'x', items: [] })
    const trimmed = trimDiary(entries, today)
    expect(trimmed).toHaveLength(25)
    expect(trimmed.filter((e) => e.photo)).toHaveLength(20)
    expect(trimmed[0].id).toBe('e24')
  })
})

describe('traceability codes', () => {
  it('reads codes and links', () => {
    expect(parseTraceCode('LD-UGU-B0930').product.id).toBe('ugu')
    expect(parseTraceCode('  ld-fish-croaker-b0930 ').product.id).toBe('fish-croaker')
    expect(parseTraceCode('https://livingdose.app/t?code=LD-OFADA-RICE-B0915').batch).toBe('B0915')
  })

  it('rejects anything else', () => {
    expect(parseTraceCode('hello')).toBeNull()
    expect(parseTraceCode('LD-NOTAPRODUCT-B0930')).toBeNull()
  })

  it('has working sample codes', () => {
    SAMPLE_CODES.forEach((c) => expect(parseTraceCode(c)).toBeTruthy())
  })
})

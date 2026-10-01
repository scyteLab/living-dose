/**
 * Food diary: meals logged with Snap a meal, kept on this device.
 * Each entry: { id, date, slot, time, photo (small JPEG data URL or null), items: [{ source, id, portion }] }
 * Photos are kept for the 20 newest entries to stay within storage limits.
 */
import { FOODS_BY_ID } from '@/data/foods'
import { RECIPES_BY_ID } from '@/data/recipes'

const key = (userId) => `ld.diary.${userId}`
export const PORTIONS = [0.75, 1, 1.5]
const MAX_PHOTOS = 20
const MAX_DAYS = 60

export function loadDiary(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(key(userId))) ?? []
  } catch {
    return []
  }
}

/** Newest first; drops photos beyond the newest 20 and entries older than 60 days. */
export function trimDiary(entries, today = new Date()) {
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - MAX_DAYS).toISOString().slice(0, 10)
  return [...entries]
    .filter((e) => e.date >= cutoff)
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .map((e, i) => (i < MAX_PHOTOS ? e : { ...e, photo: null }))
}

export function saveDiary(userId, entries) {
  const trimmed = trimDiary(entries)
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(trimmed))
  } catch {
    // Storage full: keep the entries, drop all photos
    try {
      window.localStorage.setItem(key(userId), JSON.stringify(trimmed.map((e) => ({ ...e, photo: null }))))
    } catch {
      /* storage blocked */
    }
  }
  return trimmed
}

/** The food or recipe behind a logged item, in the same shape. */
export function lookup(item) {
  if (item.source === 'recipe') {
    const r = RECIPES_BY_ID[item.id]
    return r && { ...r, portion: '1 serving' }
  }
  return FOODS_BY_ID[item.id]
}

/** Nutrition for a list of items, with portions. */
export function totals(items) {
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, salt: 0, veg: 0 }
  for (const item of items) {
    const food = lookup(item)
    if (!food) continue
    for (const k of Object.keys(sum)) sum[k] += food[k] * item.portion
  }
  return {
    kcal: Math.round(sum.kcal),
    protein: Math.round(sum.protein),
    carbs: Math.round(sum.carbs),
    fat: Math.round(sum.fat),
    fibre: Math.round(sum.fibre),
    salt: Math.round(sum.salt * 10) / 10,
    veg: Math.round(sum.veg * 2) / 2,
  }
}

/** Which meal it probably is, from the time of day. */
export function slotForTime(date = new Date()) {
  const h = date.getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

/** Search foods and recipes together. */
export function searchFoods(query, { foods, recipes }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const match = (name) => words.every((w) => name.toLowerCase().includes(w))
  if (!words.length) return []
  return [
    ...foods.filter((x) => match(x.name)).map((x) => ({ source: 'food', id: x.id, name: x.name, portion: x.portion, kcal: x.kcal })),
    ...recipes.filter((r) => match(r.name)).map((r) => ({ source: 'recipe', id: r.id, name: r.name, portion: '1 serving', kcal: r.kcal })),
  ].slice(0, 12)
}

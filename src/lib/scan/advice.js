/**
 * Advice after logging a meal. Fixed, reviewable rules (not free-form AI text),
 * so the same meal always gets the same advice and a dietitian can sign it off.
 * Tips that match the member's health check priorities come first.
 */
import { ARTICLE_FOR_PRIORITY } from '@/data/articles'
import { FOODS_BY_ID } from '@/data/foods'
import { lookup } from './diary'

const FRIED = ['dodo', 'akara', 'fried-fish', 'puff-puff', 'chin-chin', 'meat-pie', 'fried-rice', 'noodles']
const SUGARY = ['soft-drink', 'malt', 'zobo-sweet', 'tea-sugar']
const FRIED_WORDS = /\b(fried|fry|chips|fries|puff|chin chin|doughnut|samosa|spring roll)\b/i
const SUGARY_WORDS = /\b(coke|cola|fanta|sprite|soda|soft drink|malt|energy drink|juice|sweetened)\b/i

const isFried = (item) => (item.source === 'food' && FRIED.includes(item.id)) || (item.source === 'ai' && FRIED_WORDS.test(item.food?.name ?? ''))
const isSugary = (item) => (item.source === 'food' && SUGARY.includes(item.id)) || (item.source === 'ai' && SUGARY_WORDS.test(item.food?.name ?? ''))
const isBigSwallow = (item) => item.source === 'food' && FOODS_BY_ID[item.id]?.group === 'swallow' && item.portion > 1

/**
 * items: the logged items; sum: their totals (lib/scan/diary totals);
 * priorities: ids from the latest health check, e.g. ['lessSalt', 'vegetables'].
 * Returns up to `max` tips: { id, tone: 'good' | 'tip' | 'warn', fromCheck, article }.
 */
export function mealAdvice(items, sum, priorities = [], max = 3) {
  const has = (test) => items.some((it) => lookup(it) && test(it))
  const tips = []
  const add = (id, tone, priority) =>
    tips.push({ id, tone, fromCheck: Boolean(priority && priorities.includes(priority)), article: priority ? (ARTICLE_FOR_PRIORITY[priority] ?? null) : null })

  if (!items.length) return []
  if (sum.salt >= 2.5) add('saltHigh', 'warn', 'lessSalt')
  if (has(isSugary)) add('sugaryDrink', 'tip', 'sugaryDrinks')
  if (has(isFried)) add('fried', 'tip', 'lessFried')
  if (sum.veg < 1) add('addVeg', 'tip', 'vegetables')
  if (has(isBigSwallow)) add('bigSwallow', 'tip', 'weight')
  if (sum.kcal > 1000) add('bigMeal', 'tip', 'weight')
  if (sum.protein < 12 && sum.kcal > 250) add('addProtein', 'tip', null)

  if (!tips.length) return [{ id: 'balanced', tone: 'good', fromCheck: false, article: null }]
  // Health check priorities first, then warnings, then the rest
  const rank = (t) => (t.fromCheck ? 0 : t.tone === 'warn' ? 1 : 2)
  return tips.sort((a, b) => rank(a) - rank(b)).slice(0, max)
}

import { ing } from '@/lib/recipes/nutrition'

/** A recipe description; nutrition, tags, allergens and cost are worked out later. */
export const R = (id, name, meal, region, minutes, ingredients, steps, extra = {}) => ({ id, name, meal, region, minutes, ingredients, steps, ...extra })

/** Seasoning for one serving: part of a seasoning cube and a pinch of salt. */
export const season = (cube = 0.25, salt = 0.3) => [ing('stock-cube', cube, 'Seasoning cube'), ing('salt', salt, 'Salt')].filter((x) => x.qty > 0)

export { ing }

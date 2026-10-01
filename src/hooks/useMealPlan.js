import { useCallback, useEffect, useMemo, useState } from 'react'
import { RECIPES_BY_ID } from '@/data/recipes'
import { generatePlan, portionFor } from '@/lib/mealPlan/generate'
import { addDays, loadPlanStore, savePlanStore, weekStartOf } from '@/lib/mealPlan/storage'
import { dailyTargets } from '@/lib/mealPlan/targets'
import { loadLatestResult } from '@/lib/healthCheck/storage'

/**
 * Everything the Plan page needs: targets from the latest health check,
 * this week's (or next week's) plan with the person's swaps applied,
 * and actions to swap, mark as eaten, tick the shopping list and change settings.
 */
export default function useMealPlan(user) {
  const userId = user.id
  const goals = user.user_metadata?.goals ?? []
  const [record, setRecord] = useState(undefined) // undefined while loading
  const [store, setStore] = useState(() => loadPlanStore(userId))
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    let alive = true
    loadLatestResult(userId)
      .then((r) => alive && setRecord(r ?? null))
      .catch(() => alive && setRecord(null))
    return () => {
      alive = false
    }
  }, [userId])

  useEffect(() => {
    savePlanStore(userId, store)
  }, [userId, store])

  const weekStart = addDays(weekStartOf(), weekOffset * 7)
  const week = store.weeks[weekStart] ?? { overrides: {}, eaten: {}, checked: {} }
  const goalsKey = goals.join(',')
  const targets = useMemo(() => dailyTargets(record ?? null, goalsKey ? goalsKey.split(',') : []), [record, goalsKey])

  const plan = useMemo(() => {
    if (record === undefined) return null
    const base = generatePlan({ seed: userId, weekStart, settings: store.settings, targets })
    const days = base.days.map((day, d) => {
      const meals = { ...day.meals }
      for (const slot of Object.keys(meals)) {
        const swapId = week.overrides[`${d}.${slot}`]
        if (swapId && RECIPES_BY_ID[swapId]) {
          meals[slot] = { recipeId: swapId, portion: portionFor(RECIPES_BY_ID[swapId], slot, targets.kcal, store.settings.snacks), swapped: true }
        }
      }
      return { date: addDays(weekStart, d), meals }
    })
    return { ...base, days }
  }, [record, userId, weekStart, store.settings, targets, week.overrides])

  const updateWeek = useCallback(
    (fn) =>
      setStore((s) => {
        const current = s.weeks[weekStart] ?? { overrides: {}, eaten: {}, checked: {} }
        return { ...s, weeks: { ...s.weeks, [weekStart]: fn(current) } }
      }),
    [weekStart],
  )

  const swap = useCallback(
    (dayIndex, slot, recipeId) => updateWeek((w) => ({ ...w, overrides: { ...w.overrides, [`${dayIndex}.${slot}`]: recipeId } })),
    [updateWeek],
  )

  const undoSwap = useCallback(
    (dayIndex, slot) =>
      updateWeek((w) => {
        const overrides = { ...w.overrides }
        delete overrides[`${dayIndex}.${slot}`]
        return { ...w, overrides }
      }),
    [updateWeek],
  )

  const toggleEaten = useCallback(
    (dayIndex, slot) =>
      updateWeek((w) => {
        const k = `${dayIndex}.${slot}`
        return { ...w, eaten: { ...w.eaten, [k]: !w.eaten[k] } }
      }),
    [updateWeek],
  )

  const toggleChecked = useCallback((key) => updateWeek((w) => ({ ...w, checked: { ...w.checked, [key]: !w.checked[key] } })), [updateWeek])
  const resetChecked = useCallback(() => updateWeek((w) => ({ ...w, checked: {} })), [updateWeek])

  // New settings rebuild the plan, so swaps no longer apply; eaten marks are kept
  const updateSettings = useCallback(
    (settings) =>
      setStore((s) => ({
        settings,
        weeks: Object.fromEntries(Object.entries(s.weeks).map(([k, w]) => [k, { ...w, overrides: {} }])),
      })),
    [],
  )

  return {
    loading: record === undefined,
    record,
    targets,
    plan,
    settings: store.settings,
    store,
    week,
    weekStart,
    weekOffset,
    setWeekOffset,
    swap,
    undoSwap,
    toggleEaten,
    toggleChecked,
    resetChecked,
    updateSettings,
  }
}

import { useCallback, useEffect, useState } from 'react'
import { listAppointments, joinState } from '@/lib/care/appointments'
import { dayOf, loadHabits, saveHabits } from '@/lib/dashboard/habits'
import { loadLatestResult } from '@/lib/healthCheck/storage'
import { toIso } from '@/lib/mealPlan/storage'
import { listOrders } from '@/lib/shop/orders'

/**
 * Everything on the Home dashboard except the meal plan (which comes from
 * useMealPlan so meals ticked here also show as eaten on the Plan page).
 */
export default function useDashboard(user) {
  const userId = user.id
  const [data, setData] = useState({ loading: true })
  const [habits, setHabits] = useState(() => loadHabits(userId))
  const today = toIso(new Date())

  useEffect(() => {
    let alive = true
    Promise.all([
      loadLatestResult(userId).catch(() => null),
      listAppointments(userId).catch(() => []),
      listOrders(userId).catch(() => []),
    ]).then(([record, appointments, orders]) => {
      if (!alive) return
      const now = new Date()
      const nextAppt =
        appointments
          .filter((a) => a.status === 'booked' && joinState(a, now) !== 'ended')
          .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null
      let planSeen = false
      try {
        planSeen = window.localStorage.getItem(`ld.plan.seen.${userId}`) === '1'
      } catch {
        /* storage blocked */
      }
      setData({
        loading: false,
        record,
        nextAppt,
        latestOrder: orders.find((o) => o.status !== 'delivered') ?? null,
        hasOrder: orders.length > 0,
        hasAppointment: appointments.length > 0,
        planSeen,
      })
    })
    return () => {
      alive = false
    }
  }, [userId])

  useEffect(() => {
    saveHabits(userId, habits)
  }, [userId, habits])

  const updateToday = useCallback(
    (patch) => setHabits((h) => ({ ...h, [today]: { ...dayOf(h, today), ...patch(dayOf(h, today)) } })),
    [today],
  )

  return {
    ...data,
    habits,
    todayHabits: dayOf(habits, today),
    setWater: (glasses) => updateToday(() => ({ water: glasses })),
    addMinutes: (mins) => updateToday((d) => ({ minutes: Math.min(600, d.minutes + mins) })),
    setMood: (mood) => updateToday((d) => ({ mood: d.mood === mood ? null : mood })),
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadCheckins, pullCheckins, saveCheckin, streakOf } from '@/lib/checkin/checkins'
import { toIso } from '@/lib/mealPlan/storage'

/** The member's check-ins, streak and a save function. Shows this device's copy at once, then the server's. */
export default function useCheckins(userId) {
  const [list, setList] = useState(() => (userId ? loadCheckins(userId) : []))
  const [today] = useState(() => toIso(new Date()))

  useEffect(() => {
    if (!userId) return undefined
    let alive = true
    pullCheckins(userId)
      .then((merged) => alive && setList(merged))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [userId])

  const save = useCallback(
    async (input) => {
      const result = await saveCheckin(userId, { ...input, date: today })
      setList(result.list)
      return result
    },
    [userId, today],
  )

  const streak = useMemo(() => streakOf(list, today), [list, today])
  return { list, today, todays: list.find((c) => c.date === today) ?? null, streak, save }
}

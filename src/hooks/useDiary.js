import { useCallback, useState } from 'react'
import { loadDiary, saveDiary } from '@/lib/scan/diary'

/** The food diary for the signed-in member. */
export default function useDiary(userId) {
  const [entries, setEntries] = useState(() => loadDiary(userId))

  const add = useCallback(
    (entry) => {
      const id = `meal-${Date.now().toString(36)}`
      setEntries((list) => saveDiary(userId, [{ ...entry, id }, ...list]))
      return id
    },
    [userId],
  )

  const remove = useCallback((id) => setEntries((list) => saveDiary(userId, list.filter((e) => e.id !== id))), [userId])

  return { entries, add, remove }
}

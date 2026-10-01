import { useCallback, useState } from 'react'
import useAuth from '@/hooks/useAuth'

/**
 * Reads a slice of staff data and refreshes it after each action.
 * `load` gets the storage; `staff` identifies who made a change in the log.
 */
export default function useStaffData(load) {
  const { firstName, user } = useAuth()
  const [version, setVersion] = useState(0)
  const [data, setData] = useState(() => load(window.localStorage))
  const refresh = useCallback(() => {
    setData(load(window.localStorage))
    setVersion((v) => v + 1)
  }, [load])
  const staff = { name: firstName || user?.phone || user?.email || 'Staff' }
  return { data, refresh, staff, version, storage: window.localStorage }
}

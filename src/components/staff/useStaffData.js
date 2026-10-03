import { useCallback, useEffect, useState } from 'react'
import useAuth from '@/hooks/useAuth'

/**
 * Loads a slice of staff data (from the server or this browser) and reloads it
 * after each action. `loader` is an async function from lib/staff/service.js.
 * `staff` identifies who made a change in demo mode's activity log.
 */
export default function useStaffData(loader) {
  const { firstName, user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    loader()
      .then((d) => alive && (setData(d), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [loader, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const staff = { name: firstName || user?.phone || user?.email || 'Staff' }
  return { data, error, loading: data === null && !error, refresh, staff }
}

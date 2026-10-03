import { useEffect, useMemo, useState } from 'react'
import { SyncContext } from '@/context/SyncContext'
import useAuth from '@/hooks/useAuth'
import { createSyncEngine } from '@/lib/sync/engine'
import { syncApi } from '@/lib/sync/remote'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Turns on personal sync for signed-in members when Supabase is configured.
 * Writes to device storage are watched in one place, so features don't need
 * to know about syncing. When newer data arrives from another device, `version`
 * changes and the page reloads its data.
 */
export default function SyncProvider({ children }) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'idle' : 'off')
  const userId = user?.id

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    const storage = window.localStorage
    const engine = createSyncEngine({ userId, storage, api: syncApi(userId), onStatus: setStatus, onApplied: () => setVersion((v) => v + 1) })

    // Watch writes to device storage (the one place every feature saves through)
    const proto = Object.getPrototypeOf(storage)
    const original = proto.setItem
    proto.setItem = function setItem(key, value) {
      original.call(this, key, value)
      if (this === storage) engine.noteWrite(key)
    }

    const sync = () => engine.syncAll().catch(() => {})
    const onVisible = () => document.visibilityState === 'visible' && sync()
    sync()
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', onVisible)
    const every = setInterval(sync, 5 * 60 * 1000)

    return () => {
      engine.stop()
      proto.setItem = original
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(every)
    }
  }, [userId])

  const value = useMemo(() => ({ version, status }), [version, status])
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

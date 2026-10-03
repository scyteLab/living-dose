/**
 * Keeps personal data in step between a member's devices.
 *
 *  • Everything saves on the device first (fast, works offline).
 *  • A change is noticed, waits a moment, then goes up to the server.
 *  • When the app opens, comes back online or returns to the screen, newer
 *    copies come down from the server.
 *  • If the same thing changed on two devices, the most recent change wins.
 *    A copy of the device's version is kept, just in case.
 *
 * The engine is given its storage and server functions, so it can be tested
 * without a browser or a network.
 */
import { SYNCED } from './registry'

const parse = (raw) => {
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * What to do with one kind of data.
 * meta: what this device remembers ({ syncedAt, dirty, changedAt }), or undefined if never synced.
 * row: the server's copy ({ updated_at }), or undefined.
 * hasLocal: whether this device has the data at all.
 * Returns 'push', 'pull', 'pull-keep-backup' or 'none'.
 */
export function decide(meta, row, hasLocal) {
  if (!row) return hasLocal ? 'push' : 'none'
  if (!hasLocal) return 'pull'
  if (!meta) return 'pull-keep-backup' // never synced here, and both have data
  const serverNewer = !meta.syncedAt || row.updated_at > meta.syncedAt
  if (meta.dirty && serverNewer) return meta.changedAt > row.updated_at ? 'push' : 'pull-keep-backup'
  if (meta.dirty) return 'push'
  if (serverNewer) return 'pull'
  return 'none'
}

export function createSyncEngine({ userId, storage, api, onApplied = () => {}, onStatus = () => {}, now = () => new Date().toISOString(), delay = 1500 }) {
  const entries = SYNCED.map((s) => ({ ...s, storageKey: s.key(userId) }))
  const byKey = new Map(entries.map((e) => [e.storageKey, e]))
  const metaKey = `ld.sync.${userId}`
  let applying = false
  let stopped = false
  const timers = new Map()

  const readMeta = () => parse(storage.getItem(metaKey)) ?? {}
  const writeMeta = (meta) => {
    applying = true
    try {
      storage.setItem(metaKey, JSON.stringify(meta))
    } finally {
      applying = false
    }
  }
  const setMeta = (kind, patch) => writeMeta({ ...readMeta(), [kind]: { ...readMeta()[kind], ...patch } })

  async function push(entry) {
    const local = parse(storage.getItem(entry.storageKey))
    if (local == null) return
    const before = readMeta()[entry.kind]?.changedAt
    const { updated_at } = await api.put(entry.kind, entry.upload ? entry.upload(local) : local)
    // Only clear "changed" if nothing changed again while we were uploading
    const still = readMeta()[entry.kind]?.changedAt === before
    setMeta(entry.kind, { syncedAt: updated_at, ...(still ? { dirty: false } : {}) })
  }

  function pull(entry, row, keepBackup) {
    const localRaw = storage.getItem(entry.storageKey)
    applying = true
    try {
      if (keepBackup && localRaw != null) storage.setItem(`ld.sync.backup.${entry.kind}.${userId}`, localRaw)
      const value = entry.download ? entry.download(row.data, parse(localRaw)) : row.data
      storage.setItem(entry.storageKey, JSON.stringify(value))
    } finally {
      applying = false
    }
    setMeta(entry.kind, { syncedAt: row.updated_at, dirty: false })
  }

  return {
    /** Called for every write to device storage; queues an upload if it's synced data. */
    noteWrite(key) {
      if (applying || stopped) return
      const entry = byKey.get(key)
      if (!entry) return
      setMeta(entry.kind, { dirty: true, changedAt: now() })
      clearTimeout(timers.get(entry.kind))
      timers.set(
        entry.kind,
        setTimeout(() => {
          onStatus('syncing')
          push(entry)
            .then(() => onStatus('synced'))
            .catch(() => onStatus('offline'))
        }, delay),
      )
    },

    /** Compare everything with the server and bring both up to date. */
    async syncAll() {
      if (stopped) return { pulled: 0, pushed: 0 }
      onStatus('syncing')
      try {
        const rows = new Map((await api.list()).map((r) => [r.kind, r]))
        const meta = readMeta()
        let pulled = 0
        let pushed = 0
        for (const entry of entries) {
          const action = decide(meta[entry.kind], rows.get(entry.kind), storage.getItem(entry.storageKey) != null)
          if (action === 'push') {
            await push(entry)
            pushed++
          } else if (action.startsWith('pull')) {
            pull(entry, rows.get(entry.kind), action === 'pull-keep-backup')
            pulled++
          }
        }
        onStatus('synced')
        if (pulled) onApplied(pulled)
        return { pulled, pushed }
      } catch (err) {
        onStatus('offline')
        throw err
      }
    },

    stop() {
      stopped = true
      timers.forEach(clearTimeout)
    },
  }
}

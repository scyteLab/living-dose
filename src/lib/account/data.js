/**
 * Everything Living Dose keeps on this device for one person, so they can
 * download it (right of access) or delete it (right to erasure).
 * When a feature moves to Supabase, its server data must be added to the
 * account export and deletion on the server as well.
 */
const PER_USER = [
  ['healthChecks', (id) => `ld.hc.results.${id}`],
  ['healthCheckDraft', (id) => `ld.hc.draft.${id}`],
  ['mealPlan', (id) => `ld.plan.${id}`],
  ['mealPlanSeen', (id) => `ld.plan.seen.${id}`],
  ['habits', (id) => `ld.habits.${id}`],
  ['foodDiary', (id) => `ld.diary.${id}`],
  ['orders', (id) => `ld.orders.${id}`],
  ['appointments', (id) => `ld.appointments.${id}`],
  ['community', (id) => `ld.community.${id}`],
  ['household', (id) => `ld.household.${id}`],
  ['notifications', (id) => `ld.notify.${id}`],
]
const SHARED = [
  ['basket', 'ld.basket'],
  ['lastAddress', 'ld.lastAddress'],
  ['savedArticles', 'ld.learn.saved'],
  ['articleFeedback', 'ld.learn.feedback'],
  ['region', 'ld.region'],
  ['language', 'ld.language'],
]

const parse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** All stored data for this person, labelled, for the "Download my data" file. */
export function collectData(userId, storage = window.localStorage) {
  const data = {}
  for (const [label, key] of PER_USER) {
    const raw = storage.getItem(key(userId))
    if (raw != null) data[label] = parse(raw)
  }
  for (const [label, key] of SHARED) {
    const raw = storage.getItem(key)
    if (raw != null) data[label] = parse(raw)
  }
  return data
}

export function buildExport(user, storage = window.localStorage) {
  return {
    exportedAt: new Date().toISOString(),
    service: 'Living Dose',
    account: { id: user.id, firstName: user.user_metadata?.first_name ?? null, phone: user.phone || null, email: user.email || null },
    data: collectData(user.id, storage),
  }
}

/** Removes everything this device holds for the person. Returns how many items went. */
export function deleteLocalData(userId, storage = window.localStorage) {
  let removed = 0
  storage.removeItem(`ld.sync.${userId}`) // sync notes, so nothing is re-uploaded
  for (const [, key] of PER_USER) {
    if (storage.getItem(key(userId)) != null) {
      storage.removeItem(key(userId))
      removed++
    }
  }
  for (const [, key] of SHARED) {
    if (storage.getItem(key) != null) {
      storage.removeItem(key)
      removed++
    }
  }
  return removed
}

/** Saves a file to the person's device. */
export function downloadJson(filename, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

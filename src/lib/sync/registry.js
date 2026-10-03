/**
 * Personal data that follows a member between their devices.
 * Each entry: the kind stored on the server (see 0011_personal_sync.sql) and
 * the key it lives under on the device.
 */
export const SYNCED = [
  { kind: 'mealPlan', key: (u) => `ld.plan.${u}` },
  { kind: 'planSeen', key: (u) => `ld.plan.seen.${u}` },
  { kind: 'habits', key: (u) => `ld.habits.${u}` },
  { kind: 'diary', key: (u) => `ld.diary.${u}`, upload: stripPhotos, download: keepLocalPhotos },
  { kind: 'household', key: (u) => `ld.household.${u}` },
  { kind: 'notifications', key: (u) => `ld.notify.${u}` },
  { kind: 'community', key: (u) => `ld.community.${u}` },
  { kind: 'healthCheckDraft', key: (u) => `ld.hc.draft.${u}` },
  // Saved articles and feedback are kept per device; they sync for whoever is signed in
  { kind: 'savedArticles', key: () => 'ld.learn.saved' },
  { kind: 'articleFeedback', key: () => 'ld.learn.feedback' },
]

/** Meal photos stay on the device (they're large); entries sync without them. */
export function stripPhotos(entries) {
  return Array.isArray(entries) ? entries.map(({ photo, ...rest }) => ({ ...rest, photo: null, hadPhoto: Boolean(photo) || Boolean(rest.hadPhoto) })) : entries
}

/** When the diary comes down from the server, keep any photos this device already has. */
export function keepLocalPhotos(serverEntries, localEntries) {
  if (!Array.isArray(serverEntries)) return serverEntries
  const photos = new Map((Array.isArray(localEntries) ? localEntries : []).filter((e) => e.photo).map((e) => [e.id, e.photo]))
  return serverEntries.map((e) => (photos.has(e.id) ? { ...e, photo: photos.get(e.id) } : e))
}

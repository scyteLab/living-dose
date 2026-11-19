/**
 * Places Shuttle Meds plans to serve (all coming soon). Each group has a type of
 * on-site care; each setting is a kind of place an organisation can request it for.
 */
export const SETTING_GROUPS = [
  { id: 'workplace', icon: 'Building2', tone: 'sky', settings: ['offices', 'industrial', 'camps'] },
  { id: 'education', icon: 'GraduationCap', tone: 'leaf', settings: ['primary', 'secondary', 'universities', 'sports'] },
  { id: 'community', icon: 'Church', tone: 'ember', settings: ['villages', 'worship', 'markets'] },
  { id: 'residential', icon: 'House', tone: 'plum', settings: ['seniors', 'correctional', 'disaster'] },
  { id: 'events', icon: 'PartyPopper', tone: 'berry', settings: ['concerts', 'festivals', 'marathons'] },
]

export const ALL_SETTINGS = SETTING_GROUPS.flatMap((g) => g.settings.map((s) => ({ id: s, group: g.id })))

export const groupOf = (settingId) => ALL_SETTINGS.find((s) => s.id === settingId)?.group ?? null

export const ORG_SIZES = ['under50', '50to200', '200to1000', 'over1000']

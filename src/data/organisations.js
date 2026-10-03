/**
 * SAMPLE sponsoring organisations for development. Replace with real ones as
 * agreements are signed. Members join with the organisation's code.
 */
export const ORGANISATIONS = [
  { id: 'lagos-foods', name: 'Lagos Foods Ltd', sector: 'manufacturing', code: 'LAGOSFOODS', seats: 250 },
  { id: 'bright-future', name: 'Bright Future Academy', sector: 'education', code: 'BRIGHT2026', seats: 80 },
  { id: 'harbour-insure', name: 'Harbour Health Insurance', sector: 'insurance', code: 'HARBOUR', seats: 1000 },
]

export const ORGS_BY_ID = Object.fromEntries(ORGANISATIONS.map((o) => [o.id, o]))
export const findByCode = (code) => ORGANISATIONS.find((o) => o.code === String(code ?? '').trim().toUpperCase().replace(/\s+/g, '')) ?? null

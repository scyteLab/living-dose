import { describe, expect, it } from 'vitest'
import { parseWaitlistMessage, summarise, toCsv, waitlistEntry } from './waitlist'

const oldMessage = ['Shuttle Meds waitlist', 'State: Ogun, Imeko', 'Interested in: emergency, doctorCall', 'Signing up for: community'].join('\n')

describe('Shuttle Meds waitlist', () => {
  it('reads details from older rows that only have the message text', () => {
    expect(parseWaitlistMessage(oldMessage)).toEqual({ state: 'Ogun', community: 'Imeko', interests: ['emergency', 'doctorCall'], who: 'community' })
    expect(parseWaitlistMessage('State: Lagos\nInterested in: everything\nSigning up for: self')).toMatchObject({
      state: 'Lagos',
      community: '',
      interests: [],
    })
  })

  it('prefers the structured details column', () => {
    const e = waitlistEntry({
      id: 7,
      created_at: '2026-11-18T10:00:00Z',
      name: 'Bisi',
      email: '0803',
      phone: '0803',
      message: oldMessage,
      details: { state: 'Oyo', community: '', interests: ['medicines', 'nonsense'], who: 'family' },
    })
    expect(e).toMatchObject({ id: '7', state: 'Oyo', interests: ['medicines'], who: 'family', contact: '0803' })
  })

  it('counts by state, interest (none ticked = everything) and who', () => {
    const now = new Date('2026-11-18T12:00:00Z')
    const list = [
      waitlistEntry({
        id: 1,
        created_at: '2026-11-17T10:00:00Z',
        name: 'A',
        email: 'a@x.com',
        details: { state: 'Lagos', interests: ['emergency'], who: 'self' },
      }),
      waitlistEntry({ id: 2, created_at: '2026-11-01T10:00:00Z', name: 'B', email: 'b@x.com', details: { state: 'Lagos', interests: [], who: 'family' } }),
      waitlistEntry({
        id: 3,
        created_at: '2026-11-18T10:00:00Z',
        name: 'C',
        email: 'c@x.com',
        details: { state: 'Ogun', interests: ['emergency', 'mobileClinic'], who: 'self' },
      }),
    ]
    const s = summarise(list, now)
    expect(s).toMatchObject({ total: 3, lastWeek: 2, states: 2 })
    expect(s.byState[0]).toEqual({ key: 'Lagos', count: 2 })
    expect(s.byInterest.find((r) => r.key === 'emergency').count).toBe(3)
    expect(s.byInterest.find((r) => r.key === 'medicines').count).toBe(1)
    expect(s.byWho[0]).toEqual({ key: 'self', count: 2 })
  })

  it('exports a safe CSV', () => {
    const csv = toCsv([
      waitlistEntry({
        id: 1,
        created_at: '2026-11-18T10:00:00Z',
        name: '=HYPERLINK("x")',
        email: 'a@x.com',
        details: { state: 'Lagos', community: 'Ikeja, Lagos', interests: [], who: 'self' },
      }),
    ])
    const [, row] = csv.split('\n')
    expect(row).toContain(`"'=HYPERLINK(""x"")"`)
    expect(row).toContain('"Ikeja, Lagos"')
    expect(row).toContain('everything')
  })
})

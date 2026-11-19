import { beforeEach, describe, expect, it } from 'vitest'
import { acceptInvite, createInvite, familyOverview, listLinks, newCode, previewInvite, removeLink, summarise } from './family'

beforeEach(() => {
  const map = new Map()
  globalThis.window = {
    localStorage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) },
    location: { origin: 'https://livingdose.netlify.app' },
  }
})

const today = '2026-11-19'
const base = { ownerId: 'm', ownerName: 'Mama', checkinDays: [], waterToday: 0 }

describe('what a helper sees', () => {
  it('puts warning signs first', () => {
    const s = summarise({ ...base, checkinDays: [today], today: { date: today, feeling: 'bad', flags: ['urgent:chestPain'] } }, today)
    expect(s).toMatchObject({ status: 'urgent', urgent: ['chestPain'] })
  })

  it('knows unwell, done, not yet and quiet days', () => {
    expect(summarise({ ...base, checkinDays: [today], today: { feeling: 'unwell', flags: [] } }, today).status).toBe('unwell')
    expect(summarise({ ...base, checkinDays: [today, '2026-11-18'], today: { feeling: 'good', flags: [] } }, today)).toMatchObject({
      status: 'ok',
      streak: { count: 2 },
    })
    expect(summarise({ ...base, checkinDays: ['2026-11-18'] }, today)).toMatchObject({ status: 'notYet', daysSince: 1, streak: { count: 1, atRisk: true } })
    expect(summarise({ ...base, checkinDays: ['2026-11-15'] }, today)).toMatchObject({ status: 'quiet', daysSince: 4 })
    expect(summarise(base, today)).toMatchObject({ status: 'quiet', daysSince: null })
  })
})

describe('invites (this browser)', () => {
  it('makes readable codes', () => {
    expect(newCode()).toMatch(/^[A-HJ-NP-Z2-9]{10}$/)
  })

  it('invites, accepts once, links both sides and can be ended', async () => {
    const code = await createInvite({ id: 'mama' }, 'Mama Ada')
    expect(await previewInvite(code, 'tunde')).toMatchObject({ ownerName: 'Mama Ada', status: 'ok' })
    expect(await acceptInvite(code, { id: 'tunde' }, 'Tunde')).toBe('Mama Ada')
    expect((await previewInvite(code, 'tunde')).status).toBe('used')
    await expect(acceptInvite(code, { id: 'bisi' }, 'Bisi')).rejects.toMatchObject({ kind: 'used' })

    expect((await listLinks('mama')).helpers.map((l) => l.helperName)).toEqual(['Tunde'])
    expect((await listLinks('tunde')).helping.map((l) => l.ownerName)).toEqual(['Mama Ada'])

    window.localStorage.setItem('ld.checkins.mama', JSON.stringify([{ date: '2026-11-19', feeling: 'good', flags: [], symptoms: [] }]))
    window.localStorage.setItem('ld.habits.mama', JSON.stringify({ '2026-11-19': { water: 5 } }))
    const [p] = await familyOverview('tunde', new Date(2026, 10, 19, 12))
    expect(p).toMatchObject({ ownerName: 'Mama Ada', status: 'ok', waterToday: 5 })

    await removeLink('mama', 'tunde')
    expect((await listLinks('tunde')).helping).toEqual([])
  })

  it('reports a missing invite', async () => {
    expect(await previewInvite('NOPE123456', 'x')).toBeNull()
    await expect(acceptInvite('NOPE123456', { id: 'x' }, 'X')).rejects.toMatchObject({ kind: 'notFound' })
  })
})

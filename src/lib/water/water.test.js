import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_GLASSES, MIN_GAP_MS, canLog, loadSelfies, logGlass, todaysWater } from './challenge'

beforeEach(() => {
  const map = new Map()
  globalThis.window = { localStorage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } }
})

describe('water challenge', () => {
  const now = new Date(2026, 10, 17, 10, 0)

  it("adds a glass to today's water and keeps the selfie for today", () => {
    expect(logGlass('u1', { thumb: 'data:x', verified: true }, now)).toBe(1)
    expect(todaysWater('u1', '2026-11-17')).toBe(1)
    expect(loadSelfies('u1', '2026-11-17')).toHaveLength(1)
    expect(loadSelfies('u1', '2026-11-18')).toEqual([])
  })

  it('needs a short gap between glasses and has a daily ceiling', () => {
    const selfies = [{ at: now.toISOString() }]
    expect(canLog(selfies, 1, now.getTime() + 30_000)).toMatchObject({ ok: false, reason: 'tooSoon' })
    expect(canLog(selfies, 1, now.getTime() + MIN_GAP_MS)).toEqual({ ok: true })
    expect(canLog([], MAX_GLASSES)).toMatchObject({ ok: false, reason: 'max' })
  })
})

import { describe, expect, it } from 'vitest'
import { findByCode } from '@/data/organisations'
import { MIN_GROUP, aggregate, safeCount, sampleCohort, toCsv } from './aggregate'
import { joinOrganisation, leaveOrganisation, loadMembership, orgRecords } from './membership'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]))
  return { get length() { return map.size }, key: (i) => [...map.keys()][i] ?? null, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
}
const rec = (score, extra = {}) => ({ score, band: score >= 80 ? 'strong' : score >= 60 ? 'good' : 'grow', pillars: { eating: score, activity: score }, measures: { bmiCategory: 'healthy', bpCategory: 'normal', findrisc: { applicable: true, band: 'low' } }, priorities: [{ id: 'moveMore' }], ...extra })

describe('privacy rules', () => {
  it('shows nothing until there are enough health checks', () => {
    const s = aggregate(Array.from({ length: MIN_GROUP - 1 }, () => rec(70)), 30)
    expect(s.suppressed).toBe(true)
    expect(s.needed).toBe(1)
    expect(s.averageScore).toBeUndefined()
    expect(s.participation).toBe(30)
  })

  it('hides small counts so nobody can be singled out', () => {
    expect(safeCount(0, 50)).toEqual({ hidden: false, count: 0, pct: 0 })
    expect(safeCount(3, 50).hidden).toBe(true)
    expect(safeCount(3, 50).pct).toBeNull()
    expect(safeCount(5, 50).pct).toBe(10)
  })

  it('never lists a priority shared by fewer than 5 people', () => {
    const records = [...Array.from({ length: 10 }, () => rec(70)), rec(50, { priorities: [{ id: 'stopSmoking' }] })]
    const s = aggregate(records, 11)
    expect(s.priorities.map((p) => p.id)).toEqual(['moveMore'])
  })

  it('suppresses a risk measure with too few people measured', () => {
    const records = Array.from({ length: 12 }, (_, i) => rec(70, { measures: { bmiCategory: 'healthy', bpCategory: i < 3 ? 'grade1' : null, findrisc: { applicable: false } } }))
    const s = aggregate(records, 12)
    expect(s.risks.bloodPressure.suppressed).toBe(true)
    expect(s.risks.diabetes.suppressed).toBe(true)
    expect(s.risks.weight.suppressed).toBeUndefined()
  })
})

describe('statistics', () => {
  it('counts weight and blood pressure risks using the health check\'s categories', () => {
    const records = Array.from({ length: 20 }, (_, i) => rec(70, { measures: { bmiCategory: i < 5 ? 'obesity' : i < 10 ? 'overweight' : 'healthy', bpCategory: i < 6 ? 'grade1' : 'normal', findrisc: { applicable: true, band: i < 5 ? 'high' : 'low' } } }))
    const s = aggregate(records, 20)
    expect(s.risks.weight.pct).toBe(50)
    expect(s.risks.bloodPressure.pct).toBe(30)
    expect(s.risks.diabetes.pct).toBe(25)
  })

  it('averages scores and spreads bands', () => {
    const records = [...Array.from({ length: 6 }, () => rec(85)), ...Array.from({ length: 6 }, () => rec(65))]
    const s = aggregate(records, 20)
    expect(s.averageScore).toBe(75)
    expect(s.bands.strong.pct).toBe(50)
    expect(s.bands.good.pct).toBe(50)
    expect(s.participation).toBe(60)
  })

  it('exports a CSV with only anonymised figures', () => {
    const s = aggregate(sampleCohort().records, 140)
    const labels = { bands: { strong: 'Strong', good: 'Good', grow: 'Room to grow', attention: 'Needs attention' }, pillars: { eating: 'Eating', activity: 'Activity', body: 'Body', sleep: 'Sleep', mind: 'Mind', habits: 'Habits' }, risks: { weight: 'Weight', bloodPressure: 'BP', diabetes: 'Diabetes' }, priorities: new Proxy({}, { get: (_, k) => k }) }
    const csv = toCsv({ name: 'Lagos Foods Ltd' }, s, labels)
    expect(csv).toContain('"Average Living Score"')
    expect(csv.split('\n').length).toBeGreaterThan(15)
  })

  it('makes a stable sample group', () => {
    const a = sampleCohort()
    expect(a.records).toHaveLength(98)
    expect(sampleCohort().records[0]).toEqual(a.records[0])
  })
})

describe('membership', () => {
  it('needs a valid code and consent', () => {
    const s = memoryStorage()
    expect(joinOrganisation('u1', 'LAGOSFOODS', false, s).reason).toBe('consent')
    expect(joinOrganisation('u1', 'NOPE', true, s).reason).toBe('code')
    expect(findByCode(' lagos foods ')?.id).toBe('lagos-foods')
    expect(joinOrganisation('u1', 'lagosfoods', true, s).ok).toBe(true)
    expect(loadMembership('u1', s).orgId).toBe('lagos-foods')
    leaveOrganisation('u1', s)
    expect(loadMembership('u1', s)).toBeNull()
  })

  it('reads only members of that organisation, and only the needed fields', () => {
    const s = memoryStorage({
      'ld.org.u1': { orgId: 'lagos-foods' },
      'ld.org.u2': { orgId: 'bright-future' },
      'ld.org.u3': { orgId: 'lagos-foods' },
      'ld.hc.results.u1': [{ answers: { name: 'secret' }, results: { score: 70, band: 'good', pillars: {}, measures: {}, priorities: [] } }],
      'ld.hc.results.u2': [{ results: { score: 50 } }],
    })
    const { enrolled, records } = orgRecords('lagos-foods', s)
    expect(enrolled).toBe(2)
    expect(records).toHaveLength(1)
    expect(JSON.stringify(records)).not.toContain('secret')
  })
})

describe('server totals', () => {
  it('shows the server\'s hidden counts as hidden', async () => {
    const { fromServerSummary } = await import('./aggregate')
    const s = fromServerSummary({
      enrolled: 13, checked: 12, suppressed: false, average_score: 75,
      bands: { strong: null, good: 8, grow: 0, attention: 0 },
      pillars: { eating: 60 },
      risks: { weight: { base: 12, count: 6 }, bloodPressure: { base: 12, count: null }, diabetes: { suppressed: true } },
      priorities: [{ id: 'moveMore', count: 12 }],
    })
    expect(s.participation).toBe(92)
    expect(s.bands.strong).toEqual({ hidden: true, pct: null })
    expect(s.bands.good.pct).toBe(67)
    expect(s.risks.weight.pct).toBe(50)
    expect(s.risks.bloodPressure.hidden).toBe(true)
    expect(s.risks.diabetes.suppressed).toBe(true)
    expect(s.priorities).toEqual([{ id: 'moveMore', pct: 100 }])
  })

  it('keeps a small group hidden', async () => {
    const { fromServerSummary } = await import('./aggregate')
    expect(fromServerSummary({ enrolled: 5, checked: 4, suppressed: true })).toMatchObject({ suppressed: true, needed: 6, participation: 80 })
  })
})

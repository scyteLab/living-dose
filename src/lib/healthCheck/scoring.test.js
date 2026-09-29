import { describe, expect, it } from 'vitest'
import { bmiCategory, bpCategory, computeResults, findrisc, scoreBand, whtrCategory } from './scoring'
import { allComplete, firstIncomplete, toMetric } from './sections'

// The example person from the design: Adaeze, 34, 165 cm, 73.8 kg, waist 86 cm
const adaeze = {
  about: { age: '34', sex: 'female', pregnant: 0 },
  body: { unit: 'metric', cm: '165', kg: '73.8', waist: '86' },
  eating: { fv: 1, drinks: 2, cubes: 2, fried: 1, grains: 1 },
  activity: { minutes: 90, strengthDays: 1, sleepHours: 7 },
  habits: { tobacco: 0, alcohol: 0 },
  mind: { p1: 0, p2: 1, g1: 1, g2: 0 },
  history: { conditions: ['none'], bpUnknown: false, systolic: '128', diastolic: '82', highSugar: 0, bpMeds: 0, family: 1 },
}

describe('WHO / NICE / ISH categories', () => {
  it('classifies BMI (WHO)', () => {
    expect(bmiCategory(18.4)).toBe('underweight')
    expect(bmiCategory(18.5)).toBe('healthy')
    expect(bmiCategory(24.99)).toBe('healthy')
    expect(bmiCategory(25)).toBe('overweight')
    expect(bmiCategory(30)).toBe('obesity')
  })

  it('classifies waist-to-height (NICE)', () => {
    expect(whtrCategory(0.49)).toBe('healthy')
    expect(whtrCategory(0.5)).toBe('increased')
    expect(whtrCategory(0.6)).toBe('high')
  })

  it('classifies blood pressure (ISH 2020)', () => {
    expect(bpCategory(128, 82)).toBe('normal')
    expect(bpCategory(130, 80)).toBe('highNormal')
    expect(bpCategory(120, 85)).toBe('highNormal')
    expect(bpCategory(140, 85)).toBe('grade1')
    expect(bpCategory(160, 95)).toBe('grade2')
    expect(bpCategory(185, 100)).toBe('crisis')
    expect(bpCategory(150, 110)).toBe('crisis')
  })

  it('bands the Living Score', () => {
    expect(scoreBand(39)).toBe('attention')
    expect(scoreBand(40)).toBe('grow')
    expect(scoreBand(60)).toBe('good')
    expect(scoreBand(80)).toBe('strong')
  })
})

describe('FINDRISC', () => {
  it('scores the design example at 9, "slightly elevated", 1 in 25', () => {
    const r = findrisc(adaeze, { bmi: 27.1 })
    // BMI 25–30: 1, female waist 80–88: 3, under 30 min a day: 2, family (extended): 3
    expect(r.points).toBe(9)
    expect(r.band).toBe('slight')
    expect(r.risk).toBe('1 in 25')
  })

  it('reaches the maximum of 26', () => {
    const worst = {
      ...adaeze,
      about: { age: '70', sex: 'male' },
      body: { unit: 'metric', cm: '170', kg: '100', waist: '110' },
      eating: { ...adaeze.eating, fv: 0 },
      activity: { ...adaeze.activity, minutes: 0 },
      history: { ...adaeze.history, bpMeds: 1, highSugar: 1, family: 2 },
    }
    expect(findrisc(worst, { bmi: 34.6 }).points).toBe(26)
  })

  it('does not apply to people who already have diabetes', () => {
    const r = findrisc({ ...adaeze, history: { ...adaeze.history, conditions: ['type2'] } }, { bmi: 27 })
    expect(r.applicable).toBe(false)
  })
})

describe('computeResults', () => {
  const r = computeResults(adaeze, { now: new Date('2026-09-29T10:00:00Z') })

  it('computes the key numbers', () => {
    expect(r.measures.bmi).toBe(27.1)
    expect(r.measures.bmiCategory).toBe('overweight')
    expect(r.measures.whtr).toBe(0.52)
    expect(r.measures.whtrCategory).toBe('increased')
    expect(r.measures.bpCategory).toBe('normal')
    expect(r.measures.findrisc.points).toBe(9)
  })

  it('gives a score from 0 to 100 with a band', () => {
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(['attention', 'grow', 'good', 'strong']).toContain(r.band)
    Object.values(r.pillars).forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
  })

  it('ranks the same top 3 priorities as the design', () => {
    expect(r.priorities.map((p) => p.id)).toEqual(['moveMore', 'vegetables', 'sugaryDrinks'])
  })

  it('flags a blood pressure crisis', () => {
    const c = computeResults({ ...adaeze, history: { ...adaeze.history, systolic: '185', diastolic: '115' } })
    expect(c.urgent).toBe(true)
  })

  it('skips weight measures during pregnancy', () => {
    const p = computeResults({ ...adaeze, about: { ...adaeze.about, pregnant: 1 } })
    expect(p.measures.pregnant).toBe(true)
    expect(p.priorities.map((x) => x.id)).not.toContain('weight')
    expect(p.checks).toContain('pregnancy')
  })

  it('leaves mind out of the score when skipped', () => {
    const s = computeResults({ ...adaeze, mind: { skipped: true } })
    expect(s.pillars.mind).toBeNull()
  })

  it('puts stopping smoking first', () => {
    const s = computeResults({ ...adaeze, habits: { tobacco: 2, alcohol: 0 } })
    expect(s.priorities[0].id).toBe('stopSmoking')
  })
})

describe('sections', () => {
  it('converts imperial to metric', () => {
    const m = toMetric({ unit: 'imperial', ft: '5', inch: '5', lb: '160', waist: '34' })
    expect(Math.round(m.heightCm)).toBe(165)
    expect(Math.round(m.weightKg)).toBe(73)
    expect(Math.round(m.waistCm)).toBe(86)
  })

  it('knows when every section is complete', () => {
    expect(allComplete(adaeze)).toBe(true)
    expect(firstIncomplete({ ...adaeze, habits: {} })).toBe('habits')
  })
})

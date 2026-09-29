/**
 * Living Dose health check: scoring engine.
 *
 * Pure functions, no React, so they can be tested and later moved to the server.
 * Standards used:
 *  - BMI: WHO adult classification (18.5 / 25 / 30)
 *  - Waist-to-height ratio: NICE NG246 (2022): under 0.5 healthy, 0.5–0.59 increased, 0.6+ high
 *  - Blood pressure: International Society of Hypertension 2020 global guideline
 *  - Type 2 diabetes risk: FINDRISC (Lindström & Tuomilehto, Diabetes Care 2003)
 *  - Low mood and anxiety: PHQ-2 and GAD-2, positive screen at 3 or more
 *  - Diet, activity, sleep: WHO healthy diet fact sheet, WHO physical activity guidelines 2020,
 *    7–9 hours sleep for adults
 * The Living Score itself is Living Dose's own wellness measure built on these.
 * It is a guide, not a diagnosis. Weights should be reviewed by the clinical advisory board.
 */
import { asksPregnancy, toMetric } from './sections'

export const SCORING_VERSION = 1

const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))
const round1 = (v) => Math.round(v * 10) / 10
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------- measures

export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'healthy'
  if (bmi < 30) return 'overweight'
  return 'obesity'
}

export function whtrCategory(ratio) {
  if (ratio == null) return null
  if (ratio < 0.5) return 'healthy'
  if (ratio < 0.6) return 'increased'
  return 'high'
}

/** ISH 2020. 'crisis' (180/110 or higher) triggers the safety page. */
export function bpCategory(systolic, diastolic) {
  if (systolic == null || diastolic == null) return null
  if (systolic >= 180 || diastolic >= 110) return 'crisis'
  if (systolic >= 160 || diastolic >= 100) return 'grade2'
  if (systolic >= 140 || diastolic >= 90) return 'grade1'
  if (systolic >= 130 || diastolic >= 85) return 'highNormal'
  return 'normal'
}

export const isBpCrisis = (history = {}) =>
  !history.bpUnknown && bpCategory(num(history.systolic), num(history.diastolic)) === 'crisis'

/** FINDRISC bands with the published 10-year risk. */
export const FINDRISC_BANDS = [
  { max: 6, key: 'low', risk: '1 in 100' },
  { max: 11, key: 'slight', risk: '1 in 25' },
  { max: 14, key: 'moderate', risk: '1 in 6' },
  { max: 20, key: 'high', risk: '1 in 3' },
  { max: 26, key: 'veryHigh', risk: '1 in 2' },
]

export function findrisc(answers, { bmi }) {
  const { about = {}, eating = {}, activity = {}, history = {} } = answers
  const { waistCm } = toMetric(answers.body)
  const age = num(about.age) ?? 0
  const male = about.sex === 'male'
  let points = 0

  points += age < 45 ? 0 : age < 55 ? 2 : age < 65 ? 3 : 4
  points += bmi == null || bmi < 25 ? 0 : bmi <= 30 ? 1 : 3
  if (waistCm != null) {
    const [a, b] = male ? [94, 102] : [80, 88]
    points += waistCm < a ? 0 : waistCm <= b ? 3 : 4
  }
  // "At least 30 minutes of physical activity every day" ≈ 210 minutes a week
  points += (activity.minutes ?? 0) >= 210 ? 0 : 2
  // "Eat vegetables, fruit or berries every day"
  points += (eating.fv ?? 0) >= 1 ? 0 : 1
  points += history.bpMeds === 1 ? 2 : 0
  points += history.highSugar === 1 ? 5 : 0
  points += history.family === 2 ? 5 : history.family === 1 ? 3 : 0

  const band = FINDRISC_BANDS.find((b) => points <= b.max)
  const hasDiabetes = (history.conditions ?? []).some((c) => c === 'type2' || c === 'prediabetes')
  return { points, band: band.key, risk: band.risk, waistIncluded: waistCm != null, applicable: !hasDiabetes }
}

// ---------------------------------------------------------------- pillars

const FV = [0, 40, 75, 100]
const DRINKS = [100, 70, 35, 0]
const CUBES = [100, 80, 50, 15]
const FRIED = [100, 75, 40, 10]
const GRAINS = [100, 70, 35, 55] // "not sure" sits in the middle
const STRENGTH = [0, 50, 100, 100]
const TOBACCO = [100, 85, 20] // never, former, current
const ALCOHOL = [100, 85, 55, 20] // none, 1–7, 8–14, 15+ drinks a week
const BP_SCORE = { normal: 100, highNormal: 75, grade1: 45, grade2: 25, crisis: 10 }

/** Weighted average that skips missing parts and rescales the weights. */
function weighted(parts) {
  const present = parts.filter(([value]) => value != null)
  const total = present.reduce((sum, [, weight]) => sum + weight, 0)
  if (!total) return null
  return present.reduce((sum, [value, weight]) => sum + value * weight, 0) / total
}

function bmiScore(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return clamp(100 - (18.5 - bmi) * 20, 30)
  if (bmi < 25) return 100
  if (bmi < 30) return 100 - (bmi - 25) * 10
  return clamp(50 - (bmi - 30) * 5, 10)
}

function whtrScore(ratio) {
  if (ratio == null) return null
  if (ratio < 0.5) return 100
  if (ratio < 0.6) return 100 - (ratio - 0.5) * 500
  return clamp(50 - (ratio - 0.6) * 200, 20)
}

function sleepScore(hours) {
  if (hours == null) return null
  if (hours < 7) return clamp(100 - (7 - hours) * 30, 10)
  if (hours <= 9) return 100
  return clamp(100 - (hours - 9) * 20, 40)
}

export function scorePillars(answers, measures) {
  const { eating = {}, activity = {}, habits = {}, mind = {} } = answers
  const pregnant = measures.pregnant

  const eatingScore = weighted([
    [FV[eating.fv], 0.35],
    [DRINKS[eating.drinks], 0.2],
    [CUBES[eating.cubes], 0.15],
    [FRIED[eating.fried], 0.15],
    [GRAINS[eating.grains], 0.15],
  ])

  const activityScore = weighted([
    [clamp(((activity.minutes ?? 0) / 150) * 100), 0.75],
    [STRENGTH[activity.strengthDays], 0.25],
  ])

  // During pregnancy weight-based measures don't apply, so Body uses blood pressure only
  const bodyScore = weighted([
    [pregnant ? null : bmiScore(measures.bmi), 0.5],
    [pregnant ? null : whtrScore(measures.whtr), 0.3],
    [measures.bpCategory ? BP_SCORE[measures.bpCategory] : null, 0.2],
  ])

  const mindScore = mind.skipped ? null : clamp(100 - ((measures.phq2 + measures.gad2) / 12) * 100)

  const habitsScore = weighted([
    [TOBACCO[habits.tobacco], 0.6],
    [ALCOHOL[habits.alcohol], 0.4],
  ])

  const r = (v) => (v == null ? null : Math.round(v))
  return {
    eating: r(eatingScore),
    activity: r(activityScore),
    body: r(bodyScore),
    sleep: r(sleepScore(activity.sleepHours)),
    mind: r(mindScore),
    habits: r(habitsScore),
  }
}

export const PILLAR_WEIGHTS = { eating: 0.25, activity: 0.2, body: 0.2, sleep: 0.1, mind: 0.1, habits: 0.15 }

export function scoreBand(score) {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'good'
  if (score >= 40) return 'grow'
  return 'attention'
}

// ---------------------------------------------------------------- guidance

function guidelines(answers, measures) {
  const { eating = {}, activity = {}, habits = {} } = answers
  const rows = [
    { id: 'fv', you: eating.fv, status: eating.fv === 3 ? 'meets' : 'below', progress: [0, 30, 70, 100][eating.fv] },
    {
      id: 'minutes',
      you: activity.minutes,
      status: activity.minutes >= 150 ? 'meets' : 'below',
      progress: clamp((activity.minutes / 150) * 100),
    },
    { id: 'strength', you: activity.strengthDays, status: activity.strengthDays >= 2 ? 'meets' : 'below', progress: [0, 50, 100, 100][activity.strengthDays] },
    { id: 'drinks', you: eating.drinks, status: eating.drinks <= 0 ? 'meets' : eating.drinks === 1 ? 'check' : 'above', progress: [100, 65, 30, 10][eating.drinks] },
    { id: 'salt', you: eating.cubes, status: eating.cubes <= 1 ? 'meets' : 'check', progress: [100, 80, 50, 20][eating.cubes] },
    {
      id: 'sleep',
      you: activity.sleepHours,
      status: activity.sleepHours >= 7 && activity.sleepHours <= 9 ? 'meets' : 'check',
      progress: sleepScore(activity.sleepHours),
    },
    {
      id: 'habits',
      you: { tobacco: habits.tobacco, alcohol: habits.alcohol },
      status: habits.tobacco === 2 || habits.alcohol >= 2 ? 'above' : 'meets',
      progress: Math.round(weighted([[TOBACCO[habits.tobacco], 0.6], [ALCOHOL[habits.alcohol], 0.4]])),
    },
  ]
  if (measures.pregnant) return rows.filter((r) => r.id !== 'strength')
  return rows
}

/**
 * Candidate actions, ranked by how many Living Score points closing the gap would add:
 * pillar weight × the item's share of that pillar × the gap.
 * Stopping smoking and mental health support are always ranked first when they apply.
 */
function priorities(answers, measures) {
  const { eating = {}, activity = {}, habits = {} } = answers
  const out = []
  const add = (id, pillar, share, gap, params = {}) => out.push({ id, pillar, weight: PILLAR_WEIGHTS[pillar] * share * gap, params })

  if (habits.tobacco === 2) add('stopSmoking', 'habits', 1, 1000)
  if (measures.mindPositive) add('talkToSomeone', 'mind', 1, 900)
  if (eating.fv < 3) add('vegetables', 'eating', 0.35, 100 - FV[eating.fv], { now: ['0', '1 to 2', '3 to 4'][eating.fv] })
  if ((activity.minutes ?? 0) < 150) {
    add('moveMore', 'activity', 0.75, 100 - clamp((activity.minutes / 150) * 100), { minutes: activity.minutes, gap: 150 - activity.minutes })
  }
  if (eating.drinks >= 2) add('sugaryDrinks', 'eating', 0.2, 100 - DRINKS[eating.drinks])
  if (eating.cubes >= 2) add('lessSalt', 'eating', 0.15, 100 - CUBES[eating.cubes])
  if (eating.fried >= 2) add('lessFried', 'eating', 0.15, 100 - FRIED[eating.fried])
  if (eating.grains === 2) add('wholeGrains', 'eating', 0.15, 100 - GRAINS[eating.grains])
  if (activity.strengthDays < 2 && !measures.pregnant) add('strength', 'activity', 0.25, 100 - STRENGTH[activity.strengthDays])
  if (activity.sleepHours < 7) add('sleep', 'sleep', 1, 100 - sleepScore(activity.sleepHours), { hours: activity.sleepHours })
  if (habits.alcohol >= 2) add('alcohol', 'habits', 0.4, 100 - ALCOHOL[habits.alcohol])
  if (!measures.pregnant && measures.bmi >= 25 && measures.weightKg) {
    add('weight', 'body', 0.5, 100 - bmiScore(measures.bmi), { kg: Math.max(2, Math.round(measures.weightKg * 0.05)) })
  }

  // Keep the list varied: at most two priorities from the same area
  const sorted = out.sort((a, b) => b.weight - a.weight)
  const picked = []
  const perPillar = {}
  for (const p of sorted) {
    if ((perPillar[p.pillar] ?? 0) >= 2) continue
    perPillar[p.pillar] = (perPillar[p.pillar] ?? 0) + 1
    picked.push({ id: p.id, pillar: p.pillar, params: p.params })
    if (picked.length === 3) break
  }
  // Nothing to fix? Encourage keeping it up
  if (picked.length === 0) picked.push({ id: 'keepGoing', pillar: 'body', params: {} })
  return picked
}

/** Tests and follow-ups worth doing, based on the answers. */
function checks(answers, measures) {
  const { history = {} } = answers
  const out = []
  if (measures.bpCategory === 'grade1' || measures.bpCategory === 'grade2') out.push('bpDoctor')
  else if (measures.bpCategory === 'highNormal') out.push('bpRecheck')
  if (history.bpUnknown) out.push('bpUnknown')
  if (measures.findrisc.applicable && measures.findrisc.points >= 12) out.push('sugarTestSoon')
  else if (measures.findrisc.applicable && (measures.findrisc.points >= 7 || history.highSugar === 2)) out.push('sugarTest')
  if (!measures.findrisc.waistIncluded && !measures.pregnant) out.push('addWaist')
  if (measures.pregnant) out.push('pregnancy')
  return out
}

// ---------------------------------------------------------------- results

/** Everything the results page needs, from the raw answers. */
export function computeResults(answers, { now = new Date() } = {}) {
  const { heightCm, weightKg, waistCm } = toMetric(answers.body)
  const history = answers.history ?? {}
  const mind = answers.mind ?? {}
  const pregnant = asksPregnancy(answers.about) && answers.about?.pregnant === 1

  const bmi = heightCm && weightKg ? weightKg / (heightCm / 100) ** 2 : null
  const whtr = heightCm && waistCm ? waistCm / heightCm : null
  const systolic = history.bpUnknown ? null : num(history.systolic)
  const diastolic = history.bpUnknown ? null : num(history.diastolic)
  const phq2 = mind.skipped ? null : (mind.p1 ?? 0) + (mind.p2 ?? 0)
  const gad2 = mind.skipped ? null : (mind.g1 ?? 0) + (mind.g2 ?? 0)

  const measures = {
    heightCm: heightCm && round1(heightCm),
    weightKg: weightKg && round1(weightKg),
    waistCm: waistCm && round1(waistCm),
    bmi: bmi && round1(bmi),
    bmiCategory: bmiCategory(bmi),
    whtr: whtr && Math.round(whtr * 100) / 100,
    whtrCategory: whtrCategory(whtr),
    healthyWaistCm: heightCm ? Math.floor(heightCm / 2) : null,
    systolic,
    diastolic,
    bpCategory: bpCategory(systolic, diastolic),
    phq2,
    gad2,
    mindPositive: phq2 >= 3 || gad2 >= 3,
    phqPositive: phq2 >= 3,
    gadPositive: gad2 >= 3,
    pregnant,
  }
  measures.findrisc = findrisc(answers, { bmi })

  const pillars = scorePillars(answers, measures)
  const overall = weighted(Object.entries(PILLAR_WEIGHTS).map(([k, w]) => [pillars[k], w]))
  const score = Math.round(overall ?? 0)

  return {
    version: SCORING_VERSION,
    createdAt: now.toISOString(),
    score,
    band: scoreBand(score),
    pillars,
    measures,
    guidelines: guidelines(answers, measures),
    priorities: priorities(answers, measures),
    checks: checks(answers, measures),
    urgent: measures.bpCategory === 'crisis',
  }
}

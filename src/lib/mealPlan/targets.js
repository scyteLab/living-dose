/**
 * Daily targets for the meal plan, from the latest health check.
 *
 *  Energy: Mifflin–St Jeor equation × an activity factor from weekly active minutes.
 *          Gentle weight loss (−500 kcal) when BMI is 25 or more, never below
 *          1,200 kcal (women) or 1,500 kcal (men). Pregnancy: +300 kcal, no deficit.
 *  Protein: 0.8 g per kg (1.1 g per kg in pregnancy). Fibre: 30 g.
 *  Salt: under 5 g (WHO). Fruit and vegetables: 5 portions (WHO).
 *  Water: about 35 ml per kg, kept between 1.8 and 3.5 litres.
 * Without a health check, sensible adult defaults are used.
 */
import { asksPregnancy, toMetric } from '@/lib/healthCheck/sections'

const DEFAULTS = { kcal: 2000, protein: 60, fibre: 30, saltMax: 5, veg: 5, water: 2 }
const round = (v, step) => Math.round(v / step) * step

function activityFactor(minutes = 0) {
  if (minutes < 60) return 1.2
  if (minutes < 150) return 1.375
  if (minutes < 300) return 1.55
  return 1.725
}

/** What the plan should lean towards, from health check answers and onboarding goals. */
export function planFocus(record, goals = []) {
  const a = record?.answers
  const r = record?.results
  const conditions = a?.history?.conditions ?? []
  const findriscBand = r?.measures?.findrisc?.band
  const bp = r?.measures?.bpCategory
  const pregnant = Boolean(r?.measures?.pregnant) || goals.includes('pregnancy')
  return {
    diabetic:
      conditions.some((c) => c === 'type2' || c === 'prediabetes') ||
      ['moderate', 'high', 'veryHigh'].includes(findriscBand) ||
      goals.includes('sugar'),
    heart:
      conditions.some((c) => c === 'hypertension' || c === 'heart' || c === 'cholesterol') ||
      ['highNormal', 'grade1', 'grade2', 'crisis'].includes(bp) ||
      goals.includes('heart'),
    pregnancy: pregnant,
    lose: !pregnant && ((r?.measures?.bmi ?? 0) >= 25 || goals.includes('weight')),
  }
}

export function dailyTargets(record, goals = []) {
  const focus = planFocus(record, goals)
  const a = record?.answers
  if (!a) return { ...DEFAULTS, focus, basis: 'default' }

  const { heightCm, weightKg } = toMetric(a.body)
  const age = parseInt(a.about?.age, 10)
  const male = a.about?.sex === 'male'
  if (!heightCm || !weightKg || !age) return { ...DEFAULTS, focus, basis: 'default' }

  const pregnant = asksPregnancy(a.about) && a.about?.pregnant === 1
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161)
  let kcal = bmr * activityFactor(a.activity?.minutes)
  if (pregnant) kcal += 300
  else if (focus.lose) kcal = Math.max(male ? 1500 : 1200, kcal - 500)

  return {
    kcal: round(kcal, 50),
    protein: Math.round(weightKg * (pregnant ? 1.1 : 0.8)),
    fibre: 30,
    saltMax: 5,
    veg: 5,
    water: Math.min(3.5, Math.max(1.8, round((weightKg * 35) / 1000, 0.1))),
    focus: { ...focus, pregnancy: focus.pregnancy || pregnant },
    basis: 'healthCheck',
  }
}

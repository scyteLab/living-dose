/**
 * The seven sections of the health check, in order.
 * `isComplete` decides when "Continue" unlocks; the same rules guard the results.
 */
export const SECTION_IDS = ['about', 'body', 'eating', 'activity', 'habits', 'mind', 'history']

export const EATING_QUESTIONS = ['fv', 'drinks', 'cubes', 'fried', 'grains']
export const MIND_QUESTIONS = ['p1', 'p2', 'g1', 'g2']
export const CONDITIONS = ['hypertension', 'type2', 'prediabetes', 'cholesterol', 'heart', 'kidney', 'pcos', 'sickle', 'asthma', 'none']

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Height, weight and waist in metric, whichever units the person typed in. */
export function toMetric(body = {}) {
  if (body.unit === 'imperial') {
    const inches = (num(body.ft) ?? 0) * 12 + (num(body.inch) ?? 0)
    const lb = num(body.lb)
    const waistIn = num(body.waist)
    return {
      heightCm: inches > 0 ? inches * 2.54 : null,
      weightKg: lb ? lb * 0.45359237 : null,
      waistCm: waistIn ? waistIn * 2.54 : null,
    }
  }
  return { heightCm: num(body.cm), weightKg: num(body.kg), waistCm: num(body.waist) }
}

export const validBody = (body) => {
  const { heightCm, weightKg, waistCm } = toMetric(body)
  const ok = heightCm >= 100 && heightCm <= 240 && weightKg >= 25 && weightKg <= 300
  const waistOk = waistCm == null || (waistCm >= 40 && waistCm <= 200)
  return ok && waistOk
}

/** Pregnancy is only asked of women of child-bearing age. */
export const asksPregnancy = (about = {}) => about.sex === 'female' && num(about.age) != null && num(about.age) <= 55

export const validBp = (history = {}) => {
  if (history.bpUnknown) return true
  const sys = num(history.systolic)
  const dia = num(history.diastolic)
  return sys >= 70 && sys <= 260 && dia >= 40 && dia <= 160 && sys > dia
}

const answered = (obj = {}, keys) => keys.every((k) => obj[k] != null)

export const SECTION_RULES = {
  about: (a) => {
    const age = num(a.about?.age)
    if (!(age >= 18 && age <= 110) || !a.about?.sex) return false
    return asksPregnancy(a.about) ? a.about.pregnant != null : true
  },
  body: (a) => validBody(a.body),
  eating: (a) => answered(a.eating, EATING_QUESTIONS),
  activity: (a) => a.activity?.strengthDays != null && a.activity?.minutes != null && a.activity?.sleepHours != null,
  habits: (a) => answered(a.habits, ['tobacco', 'alcohol']),
  mind: (a) => a.mind?.skipped === true || answered(a.mind, MIND_QUESTIONS),
  history: (a) =>
    (a.history?.conditions?.length ?? 0) > 0 && answered(a.history, ['highSugar', 'bpMeds', 'family']) && validBp(a.history),
}

export const isSectionComplete = (id, answers) => SECTION_RULES[id](answers)
export const firstIncomplete = (answers) => SECTION_IDS.find((id) => !isSectionComplete(id, answers)) ?? null
export const allComplete = (answers) => firstIncomplete(answers) === null

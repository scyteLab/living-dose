/**
 * Anonymised group statistics for sponsoring organisations.
 *
 * Privacy rules (do not weaken without a data protection review):
 *  - Nothing is shown until at least MIN_GROUP members have a health check.
 *  - Any count from 1 to SMALL_CELL - 1 is shown as "fewer than 5", never the number.
 *  - Only totals and averages leave this file; never a single member's results.
 */
export const MIN_GROUP = 10
export const SMALL_CELL = 5

const PILLARS = ['eating', 'activity', 'body', 'sleep', 'mind', 'habits']
const BANDS = ['strong', 'good', 'grow', 'attention']

/** A count that's safe to show: exact if 0 or ≥ SMALL_CELL, otherwise hidden. */
export function safeCount(n, total) {
  if (n > 0 && n < SMALL_CELL) return { hidden: true, pct: null }
  return { hidden: false, count: n, pct: total ? Math.round((n / total) * 100) : 0 }
}

const mean = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

/**
 * records: each member's latest health check results (score, band, pillars, measures, priorities).
 * enrolled: how many people have joined through the organisation.
 */
export function aggregate(records, enrolled) {
  const checked = records.length
  const base = { enrolled, checked, participation: enrolled ? Math.round((checked / enrolled) * 100) : 0 }
  if (checked < MIN_GROUP) return { ...base, suppressed: true, needed: MIN_GROUP - checked }

  const pillars = Object.fromEntries(PILLARS.map((p) => [p, mean(records.map((r) => r.pillars?.[p]).filter((v) => typeof v === 'number'))]))
  const bands = Object.fromEntries(BANDS.map((b) => [b, safeCount(records.filter((r) => r.band === b).length, checked)]))

  const measured = (fn) => records.filter(fn)
  const withBmi = measured((r) => r.measures?.bmiCategory)
  const withBp = measured((r) => r.measures?.bpCategory)
  const withRisk = measured((r) => r.measures?.findrisc?.applicable)
  const risk = (list, test) => (list.length >= MIN_GROUP ? { ...safeCount(list.filter(test).length, list.length), base: list.length } : { suppressed: true })

  const priorityCounts = {}
  for (const r of records) for (const p of r.priorities ?? []) priorityCounts[p.id] = (priorityCounts[p.id] ?? 0) + 1
  const priorities = Object.entries(priorityCounts)
    .filter(([, n]) => n >= SMALL_CELL)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, n]) => ({ id, pct: Math.round((n / checked) * 100) }))

  return {
    ...base,
    suppressed: false,
    averageScore: mean(records.map((r) => r.score)),
    bands,
    pillars,
    risks: {
      weight: risk(withBmi, (r) => ['overweight', 'obesity'].includes(r.measures.bmiCategory)),
      bloodPressure: risk(withBp, (r) => ['grade1', 'grade2', 'crisis'].includes(r.measures.bpCategory)),
      diabetes: risk(withRisk, (r) => ['moderate', 'high', 'veryHigh'].includes(r.measures.findrisc.band)),
    },
    priorities,
  }
}

/** The report as CSV, using only the anonymised figures. */
export function toCsv(org, stats, labels) {
  const rows = [
    ['Organisation', org.name],
    ['Generated', new Date().toISOString().slice(0, 10)],
    ['People enrolled', stats.enrolled],
    ['Health checks completed', stats.checked],
    ['Participation (%)', stats.participation],
  ]
  if (!stats.suppressed) {
    rows.push(['Average Living Score', stats.averageScore])
    for (const [b, v] of Object.entries(stats.bands)) rows.push([`Score band: ${labels.bands[b]} (%)`, v.hidden ? 'fewer than 5 people' : v.pct])
    for (const [p, v] of Object.entries(stats.pillars)) rows.push([`Average ${labels.pillars[p]} score`, v])
    for (const [k, v] of Object.entries(stats.risks)) rows.push([`${labels.risks[k]} (%)`, v.suppressed ? 'not enough data' : v.hidden ? 'fewer than 5 people' : v.pct])
    for (const p of stats.priorities) rows.push([`Priority: ${labels.priorities[p.id]} (%)`, p.pct])
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

/** Fictional group for previewing the portal in demo mode (deterministic). */
export function sampleCohort(size = 140, checkedShare = 0.7, seed = 42) {
  let s = seed
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const pick = (weights) => {
    const r = rand()
    let acc = 0
    for (const [k, w] of weights) if ((acc += w) >= r) return k
    return weights.at(-1)[0]
  }
  const clamp = (v) => Math.max(10, Math.min(100, Math.round(v)))
  const records = Array.from({ length: Math.round(size * checkedShare) }, () => {
    // Each person has their own overall level, so scores spread like a real group
    const level = 38 + rand() * 50
    const around = (offset) => clamp(level + offset + (rand() - 0.5) * 30)
    const pillars = { eating: around(-8), activity: around(-12), body: around(2), sleep: around(6), mind: around(5), habits: around(12) }
    const score = Math.round(Object.values(pillars).reduce((a, b) => a + b, 0) / 6)
    const band = score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'grow' : 'attention'
    const priorities = ['moveMore', 'vegetables', 'sugaryDrinks', 'lessSalt', 'sleep', 'weight', 'wholeGrains', 'lessFried'].filter(() => rand() < 0.35).slice(0, 3).map((id) => ({ id }))
    return {
      score,
      band,
      pillars,
      priorities,
      measures: {
        bmiCategory: pick([['healthy', 0.42], ['overweight', 0.33], ['obesity', 0.2], ['underweight', 0.05]]),
        bpCategory: rand() < 0.75 ? pick([['normal', 0.62], ['highNormal', 0.18], ['grade1', 0.15], ['grade2', 0.05]]) : null,
        findrisc: { applicable: true, band: pick([['low', 0.38], ['slight', 0.32], ['moderate', 0.17], ['high', 0.11], ['veryHigh', 0.02]]) },
      },
    }
  })
  return { enrolled: size, records }
}

/**
 * Turns the server's organisation_summary() (counts already made safe on the
 * server) into the same shape as aggregate(), for the overview page.
 */
export function fromServerSummary(r) {
  const base = { enrolled: r.enrolled, checked: r.checked, participation: r.enrolled ? Math.round((r.checked / r.enrolled) * 100) : 0 }
  if (r.suppressed) return { ...base, suppressed: true, needed: Math.max(0, MIN_GROUP - r.checked) }
  const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
  const cell = (n, total) => (n == null ? { hidden: true, pct: null } : { hidden: false, count: n, pct: pct(n, total) })
  return {
    ...base,
    suppressed: false,
    averageScore: r.average_score,
    bands: Object.fromEntries(Object.entries(r.bands ?? {}).map(([b, n]) => [b, cell(n, r.checked)])),
    pillars: r.pillars ?? {},
    risks: Object.fromEntries(Object.entries(r.risks ?? {}).map(([k, v]) => [k, v?.suppressed ? { suppressed: true } : { ...cell(v.count, v.base), base: v.base }])),
    priorities: (r.priorities ?? []).map((p) => ({ id: p.id, pct: pct(p.count, r.checked) })),
  }
}

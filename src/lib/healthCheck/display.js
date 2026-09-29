/** Colours and scales shared by the questions and the results page. */

export const BMI_TONE = { underweight: 'sky', healthy: 'leaf', overweight: 'ember', obesity: 'berry' }
export const WHTR_TONE = { healthy: 'leaf', increased: 'ember', high: 'berry' }
export const BP_TONE = { normal: 'leaf', highNormal: 'ember', grade1: 'berry', grade2: 'berry', crisis: 'berry' }
export const FINDRISC_TONE = { low: 'leaf', slight: 'ember', moderate: 'ember', high: 'berry', veryHigh: 'berry' }
export const STATUS_TONE = { meets: 'leaf', below: 'ember', above: 'ember', check: 'sky' }

// On the dark results panel
export const PILLAR_COLOUR = {
  eating: '#f57f17',
  activity: '#369ff3',
  body: '#7caf42',
  sleep: '#a58fd3',
  mind: '#f2c14e',
  habits: '#a9cf7f',
}
export const BAND_COLOUR = { strong: '#a9cf7f', good: '#7dc0f7', grow: '#f8a865', attention: '#e0738a' }

const labelsOf = (t, key) => t(`scale.${key}`, { returnObjects: true })

// BMI from 15 to 40
export const bmiPct = (bmi) => ((bmi - 15) / 25) * 100
export function bmiSegments(t) {
  const [a, b, c, d] = labelsOf(t, 'bmi')
  return [
    { size: 14, colour: '#7dc0f7', label: a },
    { size: 26, colour: '#7caf42', label: b },
    { size: 20, colour: '#f8a865', label: c },
    { size: 40, colour: '#e0738a', label: d },
  ]
}

// Waist-to-height from 0.35 to 0.75 (healthy under 0.5, increased to 0.6, high above)
export const whtrPct = (ratio) => ((ratio - 0.35) / 0.4) * 100
export function whtrSegments(t) {
  const [a, b, c] = labelsOf(t, 'whtr')
  return [
    { size: 37.5, colour: '#7caf42', label: a },
    { size: 25, colour: '#f8a865', label: b },
    { size: 37.5, colour: '#e0738a', label: c },
  ]
}

// Systolic 100–180 (normal under 130, high-normal to 140), diastolic 70–110 (85, 90):
// the marker follows whichever number is further along
export const bpPct = (systolic, diastolic) => {
  const s = (systolic - 100) / 80
  const d = diastolic < 85 ? ((diastolic - 70) / 15) * 0.375 : diastolic < 90 ? 0.375 + ((diastolic - 85) / 5) * 0.125 : 0.5 + ((diastolic - 90) / 20) * 0.5
  return Math.max(s, d) * 100
}
export function bpSegments(t) {
  const [a, b, c] = labelsOf(t, 'bp')
  return [
    { size: 37.5, colour: '#7caf42', label: a },
    { size: 12.5, colour: '#f8a865', label: b },
    { size: 50, colour: '#e0738a', label: c },
  ]
}

// FINDRISC 0 to 26, five bands
export const findriscPct = (points) => {
  const bands = [
    [0, 6],
    [7, 11],
    [12, 14],
    [15, 20],
    [21, 26],
  ]
  const i = bands.findIndex(([, max]) => points <= max)
  const [lo, hi] = bands[i]
  return (i + (points - lo + 0.5) / (hi - lo + 1)) * 20
}
export function findriscSegments(t) {
  const labels = labelsOf(t, 'findrisc')
  const colours = ['#7caf42', '#c5de9f', '#f8a865', '#ee8b5b', '#e0738a']
  return labels.map((label, i) => ({ size: 20, colour: colours[i], label }))
}

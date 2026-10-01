/**
 * Challenge progress, worked out from what members already log on Home
 * (water and active minutes) and in their meal plan (meals marked as eaten).
 */
import { WATER_GOAL } from '@/lib/dashboard/habits'
import { weekDays, weekMinutes } from '@/lib/dashboard/insights'

export function challengeProgress(challenge, { habits = {}, planStore = { weeks: {} } } = {}, today = new Date()) {
  let value = 0
  if (challenge.metric === 'waterDays') {
    value = weekDays({}, today).filter((d) => !d.isFuture && (habits[d.date]?.water ?? 0) >= WATER_GOAL).length
  } else if (challenge.metric === 'weekMinutes') {
    value = weekMinutes(habits, today)
  } else if (challenge.metric === 'loggedDays') {
    value = weekDays(planStore, today).filter((d) => d.logged).length
  }
  return { value: Math.min(value, challenge.target), target: challenge.target, done: value >= challenge.target, pct: Math.min(100, Math.round((value / challenge.target) * 100)) }
}

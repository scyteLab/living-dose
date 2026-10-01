import { describe, expect, it } from 'vitest'
import { daysLeftInWeek, gettingStarted, mealStreak, partOfDay, weekDays, weekMinutes, weekWaterAverage } from './insights'

// Thursday 1 October 2026; the week starts Monday 28 September
const TODAY = new Date(2026, 9, 1, 9, 30)
const eatenOn = (days) => ({ weeks: { '2026-09-28': { eaten: Object.fromEntries(days.map((d) => [`${d}.lunch`, true])) }, '2026-09-21': { eaten: { '6.dinner': true, '5.lunch': true } } } })

describe('meal streak', () => {
  it('counts back from yesterday when nothing is logged yet today', () => {
    // Mon, Tue, Wed this week + Sat, Sun last week = 5
    expect(mealStreak(eatenOn([0, 1, 2]), TODAY)).toBe(5)
  })

  it('includes today once something is logged', () => {
    expect(mealStreak(eatenOn([0, 1, 2, 3]), TODAY)).toBe(6)
  })

  it('stops at a missed day', () => {
    expect(mealStreak(eatenOn([0, 2]), TODAY)).toBe(1)
    expect(mealStreak({ weeks: {} }, TODAY)).toBe(0)
  })
})

describe('this week', () => {
  it('lists Monday to Sunday with today marked', () => {
    const days = weekDays(eatenOn([0, 1]), TODAY)
    expect(days.map((d) => d.date)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(days[3].isToday).toBe(true)
    expect(days[4].isFuture).toBe(true)
    expect(days.filter((d) => d.logged)).toHaveLength(2)
  })

  it('adds up active minutes and averages water', () => {
    const habits = { '2026-09-28': { minutes: 30, water: 6 }, '2026-09-30': { minutes: 20, water: 7 }, '2026-10-01': { minutes: 10 }, '2026-10-02': { minutes: 99 } }
    expect(weekMinutes(habits, TODAY)).toBe(60) // Friday is in the future
    expect(weekWaterAverage(habits, TODAY)).toBe(6.5)
    expect(weekWaterAverage({}, TODAY)).toBeNull()
  })

  it('counts the days left including today', () => {
    expect(daysLeftInWeek(TODAY)).toBe(4) // Thu, Fri, Sat, Sun
  })
})

describe('getting started', () => {
  it('keeps the meal plan locked until the health check is done', () => {
    const g = gettingStarted({ hasResult: false, planSeen: false, hasOrder: false, hasAppointment: false })
    expect(g.done).toBe(0)
    expect(g.next.id).toBe('check')
    expect(g.steps[1].locked).toBe(true)
  })

  it('moves on to the next open step', () => {
    const g = gettingStarted({ hasResult: true, planSeen: true, hasOrder: false, hasAppointment: true })
    expect(g.done).toBe(3)
    expect(g.next.id).toBe('shop')
  })
})

describe('greeting', () => {
  it('follows the clock', () => {
    expect(partOfDay(new Date(2026, 9, 1, 8))).toBe('morning')
    expect(partOfDay(new Date(2026, 9, 1, 13))).toBe('afternoon')
    expect(partOfDay(new Date(2026, 9, 1, 19))).toBe('evening')
  })
})

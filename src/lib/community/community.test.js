import { describe, expect, it } from 'vitest'
import { CHALLENGES, GROUPS_BY_ID, SEED_POSTS } from '@/data/community'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import { challengeProgress } from './challenges'
import { checkPost, mentionsCrisis } from './safety'
import { buildFeed, timeAgo } from './store'

const EMPTY = { posts: [], replies: {}, joined: [], helpful: [], reported: [], challenges: [] }

describe('safety checks', () => {
  it('notices crisis language without blocking the post', () => {
    expect(mentionsCrisis('Some days I want to die')).toBe(true)
    expect(mentionsCrisis('I have been thinking about suicide')).toBe(true)
    expect(mentionsCrisis('I keep hurting myself')).toBe(true)
    expect(mentionsCrisis('This diet is killing me lol')).toBe(false)
    const r = checkPost('Lately I feel like I want to die and nothing helps')
    expect(r.ok).toBe(true)
    expect(r.crisis).toBe(true)
  })

  it('keeps posts a sensible length', () => {
    expect(checkPost('hi').reason).toBe('short')
    expect(checkPost('x'.repeat(2001)).reason).toBe('long')
  })

  it('keeps phone numbers and emails out of public posts', () => {
    expect(checkPost('Call me on 08012345678 for tips').reason).toBe('contact')
    expect(checkPost('Message me at ada@example.com please').reason).toBe('contact')
    expect(checkPost('My number is 0801 234 5678, call me').reason).toBe('contact')
    expect(checkPost('Or +234 803-123-4567 on WhatsApp').reason).toBe('contact')
    expect(checkPost('I walked 30 minutes today and drank 8 glasses').ok).toBe(true)
  })
})

describe('feed', () => {
  it('has valid sample posts', () => {
    SEED_POSTS.forEach((p) => {
      expect(GROUPS_BY_ID[p.group]).toBeTruthy()
      p.replies.filter((r) => r.professionalId).forEach((r) => expect(PROFESSIONALS_BY_ID[r.professionalId]).toBeTruthy())
    })
  })

  it('anonymous group posts have no names', () => {
    SEED_POSTS.filter((p) => GROUPS_BY_ID[p.group].anonymous).forEach((p) => {
      expect(p.author).toBeNull()
      p.replies.filter((r) => !r.professionalId).forEach((r) => expect(r.author).toBeNull())
    })
  })

  it('puts the newest first and adds the member\'s own posts and replies', () => {
    const now = Date.now()
    const data = { ...EMPTY, posts: [{ id: 'mine', group: 'blood-sugar', author: 'Me', body: 'My first post here', createdAt: new Date(now).toISOString(), helpful: 0, replies: [] }], replies: { 'seed-2': [{ id: 'r', author: 'Me', body: 'Nice', createdAt: new Date(now).toISOString() }] } }
    const feed = buildFeed(data, now)
    expect(feed[0].id).toBe('mine')
    expect(feed.find((p) => p.id === 'seed-2').replies).toHaveLength(2)
  })

  it('counts helpful and hides reported posts', () => {
    const feed = buildFeed({ ...EMPTY, helpful: ['seed-1'], reported: ['seed-3'] })
    const p1 = feed.find((p) => p.id === 'seed-1')
    expect(p1.helpfulByMe).toBe(true)
    expect(p1.helpfulCount).toBe(19)
    expect(feed.find((p) => p.id === 'seed-3')).toBeUndefined()
  })

  it('says how long ago', () => {
    const now = Date.parse('2026-10-01T12:00:00Z')
    expect(timeAgo('2026-10-01T11:55:00Z', 'en', now)).toBe('5 minutes ago')
    expect(timeAgo('2026-09-30T12:00:00Z', 'en', now)).toBe('yesterday')
  })
})

describe('challenges', () => {
  const today = new Date(2026, 9, 1, 10) // Thursday
  it('counts water days at 8 glasses', () => {
    const habits = { '2026-09-28': { water: 8 }, '2026-09-29': { water: 6 }, '2026-09-30': { water: 9 } }
    const p = challengeProgress(CHALLENGES[0], { habits }, today)
    expect(p.value).toBe(2)
    expect(p.done).toBe(false)
  })

  it('adds up minutes for the 150 challenge', () => {
    const habits = { '2026-09-28': { minutes: 60 }, '2026-09-29': { minutes: 100 } }
    const p = challengeProgress(CHALLENGES[1], { habits }, today)
    expect(p.value).toBe(150)
    expect(p.done).toBe(true)
    expect(p.pct).toBe(100)
  })
})

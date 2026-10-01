import { describe, expect, it } from 'vitest'
import { ARTICLES, ARTICLE_FOR_PRIORITY, ARTICLES_BY_SLUG, TOPICS } from '@/data/articles'
import { articlesForPriorities, LIBRARY, readingMinutes, relatedArticles, searchLibrary } from './content'

describe('articles', () => {
  it('are complete, with sources and takeaways', () => {
    const slugs = new Set()
    for (const a of ARTICLES) {
      expect(slugs.has(a.slug)).toBe(false)
      slugs.add(a.slug)
      expect(a.slug).toMatch(/^[a-z0-9-]+$/)
      expect(TOPICS).toContain(a.topic)
      expect(a.sections.length).toBeGreaterThan(1)
      expect(a.takeaways.length).toBeGreaterThan(1)
      expect(a.sources.length).toBeGreaterThan(0)
    }
  })

  it('cover every health check priority', () => {
    const priorities = ['vegetables', 'moveMore', 'sugaryDrinks', 'lessSalt', 'lessFried', 'wholeGrains', 'strength', 'sleep', 'alcohol', 'weight', 'stopSmoking', 'talkToSomeone', 'keepGoing']
    priorities.forEach((p) => expect(ARTICLES_BY_SLUG[ARTICLE_FOR_PRIORITY[p]]).toBeTruthy())
  })

  it('never recommend liver in pregnancy', () => {
    const preg = ARTICLES_BY_SLUG['eating-well-in-pregnancy']
    const eatMore = preg.sections.find((s) => s.heading === 'Eat more of').list.join(' ')
    expect(/liver/i.test(eatMore)).toBe(false)
  })

  it('point people in crisis to emergency help', () => {
    const mind = ARTICLES_BY_SLUG['talking-about-feelings']
    expect(mind.sections.some((s) => (s.paragraphs ?? []).some((p) => p.includes('112')))).toBe(true)
  })

  it('give a sensible reading time', () => {
    ARTICLES.forEach((a) => {
      expect(readingMinutes(a)).toBeGreaterThanOrEqual(1)
      expect(readingMinutes(a)).toBeLessThan(10)
    })
  })
})

describe('library search', () => {
  it('includes articles and recipes', () => {
    expect(LIBRARY.filter((i) => i.kind === 'article').length).toBe(ARTICLES.length)
    expect(LIBRARY.filter((i) => i.kind === 'recipe').length).toBeGreaterThan(20)
  })

  it('finds by words anywhere in the content', () => {
    const hits = searchLibrary({ query: 'seasoning cubes' })
    expect(hits[0].id).toBe('fewer-seasoning-cubes')
    expect(searchLibrary({ query: 'moi moi', kind: 'recipe' }).length).toBeGreaterThan(0)
  })

  it('filters by topic and kind', () => {
    searchLibrary({ topic: 'diabetes' }).forEach((i) => expect(i.topic).toBe('diabetes'))
    searchLibrary({ kind: 'article' }).forEach((i) => expect(i.kind).toBe('article'))
  })
})

describe('for you', () => {
  it('follows the health check priorities in order', () => {
    const picks = articlesForPriorities([{ id: 'moveMore' }, { id: 'vegetables' }, { id: 'sugaryDrinks' }])
    expect(picks.map((a) => a.slug)).toEqual(['150-active-minutes', 'more-vegetables', 'better-drinks'])
  })

  it('suggests related articles on the same topic first', () => {
    const related = relatedArticles('better-drinks')
    expect(related[0].topic).toBe('diabetes')
    expect(related.map((a) => a.slug)).not.toContain('better-drinks')
  })
})

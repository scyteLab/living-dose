import { ARTICLES, ARTICLE_FOR_PRIORITY, ARTICLES_BY_SLUG } from '@/data/articles'
import { RECIPES } from '@/data/recipes'

/** All the words in an article, for reading time and search. */
export function articleText(a) {
  return [a.title, a.summary, ...a.sections.flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.list ?? []), s.tip ?? '']), ...a.takeaways].join(' ')
}

/** Minutes to read at about 200 words a minute, never less than 1. */
export const readingMinutes = (a) => Math.max(1, Math.round(articleText(a).split(/\s+/).length / 200))

const RECIPE_TOPIC = (r) => (r.tags.includes('diabetic') ? 'diabetes' : r.tags.includes('heart') ? 'heart' : r.tags.includes('pregnancy') ? 'pregnancy' : 'eating')

/** One list of everything in Learn, articles and recipes, in a shared shape. */
export const LIBRARY = [
  ...ARTICLES.map((a) => ({ kind: 'article', id: a.slug, title: a.title, summary: a.summary, topic: a.topic, minutes: readingMinutes(a), text: articleText(a).toLowerCase() })),
  ...RECIPES.map((r) => ({
    kind: 'recipe',
    id: r.id,
    title: r.name,
    summary: r.steps[0],
    topic: RECIPE_TOPIC(r),
    meal: r.meal,
    minutes: r.minutes,
    kcal: r.kcal,
    tags: r.tags,
    text: `${r.name} ${r.ingredients.map((i) => i.name).join(' ')} ${r.steps.join(' ')}`.toLowerCase(),
  })),
]

/** Search and filter the library. Every word must match somewhere. */
export function searchLibrary({ query = '', topic = 'all', kind = 'all' } = {}) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return LIBRARY.filter(
    (item) => (topic === 'all' || item.topic === topic) && (kind === 'all' || item.kind === kind) && words.every((w) => item.text.includes(w) || item.title.toLowerCase().includes(w)),
  )
}

/** Articles that match the person's health check priorities, in priority order. */
export function articlesForPriorities(priorities = [], limit = 3) {
  const slugs = priorities.map((p) => ARTICLE_FOR_PRIORITY[p.id]).filter(Boolean)
  return [...new Set(slugs)].slice(0, limit).map((s) => ARTICLES_BY_SLUG[s])
}

/** Articles on the same topic first, then others. */
export function relatedArticles(slug, limit = 3) {
  const current = ARTICLES_BY_SLUG[slug]
  return ARTICLES.filter((a) => a.slug !== slug)
    .sort((a, b) => (b.topic === current.topic) - (a.topic === current.topic))
    .slice(0, limit)
}

/** Where an article or recipe lives. */
export const itemHref = (item) => (item.kind === 'recipe' ? `/learn/recipes/${item.id}` : `/learn/${item.id}`)

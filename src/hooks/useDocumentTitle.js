import { useEffect } from 'react'

const DEFAULT_TITLE = 'Living Dose — Healthy living made affordable'
const DEFAULT_DESCRIPTION = 'Healthy food, personal nutrition and care from experts, in one app. Healthy living made affordable.'

function setMeta(selector, attr, name, content) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Sets the browser tab title ("About us | Living Dose") and, when given, the
 * page description used by search engines and link previews.
 */
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    const full = title ? `${title} | Living Dose` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESCRIPTION
    document.title = full
    setMeta('meta[name="description"]', 'name', 'description', desc)
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc)
  }, [title, description])
}

import { useEffect, useState } from 'react'

/**
 * True once the element behind `ref` has scrolled into view.
 * Stays true afterwards (the reveal only plays once).
 */
export default function useInView(ref, { threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, inView, threshold, rootMargin])

  return inView
}

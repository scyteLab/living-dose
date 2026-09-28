import { useEffect, useState } from 'react'

/**
 * Returns a scale (0–1) that fits a fixed-size design of `width` × `height`
 * inside the element behind `ref`. Never scales up.
 * Below `minViewport` it returns 1 so phones can use their own layout instead.
 */
export default function useFitScale(ref, { width, height, minViewport = 600 }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      if (window.innerWidth < minViewport) {
        setScale(1)
        return
      }
      const box = el.getBoundingClientRect()
      const next = Math.min(1, box.width / width, box.height / height)
      setScale(Math.round(next * 1000) / 1000)
    }

    // ResizeObserver also fires once right away, so no separate first call is needed
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, width, height, minViewport])

  return scale
}

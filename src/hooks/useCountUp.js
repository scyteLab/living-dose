import { useEffect, useState } from 'react'
import usePrefersReducedMotion from './usePrefersReducedMotion'

/**
 * Counts from 0 up to `target` with an ease-out curve.
 * Returns the final value straight away when motion is reduced or disabled.
 */
export default function useCountUp(target, { duration = 1200, delay = 0, enabled = true } = {}) {
  const reduced = usePrefersReducedMotion()
  const run = enabled && !reduced
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!run) return

    let frame
    let start
    const tick = (now) => {
      if (start === undefined) start = now
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [target, duration, delay, run])

  return run ? value : target
}

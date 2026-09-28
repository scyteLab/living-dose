import useCountUp from '@/hooks/useCountUp'
import styles from './ScoreRing.module.css'

/**
 * Circular progress ring with a number in the middle.
 * The ring fills and the number counts up together on first render.
 * Colours come from CSS variables so it works on light or dark cards:
 *   --ring-track, --ring-fill, --ring-text
 */
export default function ScoreRing({ value, max = 100, size = 104, stroke = 10, animate = true, delay = 300, className }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const shown = useCountUp(value, { duration: 1600, delay, enabled: animate })
  const offset = circumference * (1 - Math.min(shown, max) / max)

  return (
    <span className={`${styles.ring} ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className={styles.fill}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.value} style={{ fontSize: size * 0.32 }}>
        {Math.round(shown)}
      </span>
    </span>
  )
}

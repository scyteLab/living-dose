import styles from './Logo.module.css'

/** The three-block mark. Decorative by default; the wordmark carries the name. */
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size * 1.23} viewBox="0 0 65 80" aria-hidden="true">
      <path d="M0 26H31V80C11 80 0 70 0 52Z" fill="var(--leaf)" />
      <path d="M34 0C55 0 65 10 65 30V62H34Z" fill="var(--ember)" />
      <path d="M34 64.5H65C65 74 60 80 50 80H34Z" fill="var(--sky)" />
    </svg>
  )
}

/** Mark + wordmark. Use `inverse` on dark backgrounds. */
export default function Logo({ size = 24, inverse = false, showWordmark = true }) {
  return (
    <span className={styles.logo}>
      <LogoMark size={size} />
      {showWordmark ? (
        <span className={inverse ? `${styles.word} ${styles.inverse}` : styles.word}>LIVING DOSE</span>
      ) : (
        <span className="sr-only">Living Dose</span>
      )}
    </span>
  )
}

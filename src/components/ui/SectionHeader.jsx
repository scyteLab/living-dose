import clsx from 'clsx'
import styles from './SectionHeader.module.css'

/**
 * Standard section heading: optional eyebrow, title, optional intro.
 * `tone` colours the eyebrow; `inverse` is for dark bands; `align="center"` centres it.
 * Use `as` to pick the heading level (h2 by default).
 */
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  tone = 'leaf',
  inverse = false,
  align = 'start',
  as: Heading = 'h2',
  id,
  className,
}) {
  return (
    <header className={clsx(styles.header, styles[align], inverse && styles.inverse, className)}>
      {eyebrow && <p className={clsx(styles.eyebrow, styles[tone])}>{eyebrow}</p>}
      <Heading id={id} className={styles.title}>
        {title}
      </Heading>
      {intro && <p className={styles.intro}>{intro}</p>}
    </header>
  )
}

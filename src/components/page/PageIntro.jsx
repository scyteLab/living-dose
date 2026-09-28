import clsx from 'clsx'
import styles from './PageIntro.module.css'

/**
 * The banner at the top of content pages (About, Contact, FAQ, legal).
 * The three soft shapes on the right echo the logo.
 * `children` sits under the intro, e.g. buttons or a search box.
 */
export default function PageIntro({ eyebrow, title, intro, tone = 'leaf', children, className }) {
  return (
    <header className={clsx(styles.intro, className)}>
      <div className={styles.copy}>
        {eyebrow && <p className={clsx(styles.eyebrow, styles[tone])}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {intro && <p className={styles.text}>{intro}</p>}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
      <div className={styles.shapes} aria-hidden="true">
        <span className={styles.leaf} />
        <span className={styles.ember} />
        <span className={styles.sky} />
      </div>
    </header>
  )
}

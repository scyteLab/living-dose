import styles from './PageHeader.module.css'

/** Title block at the top of each page. `tone` tints the icon badge. */
export default function PageHeader({ title, intro, icon: Icon, tone = 'leaf' }) {
  return (
    <header className={styles.header}>
      {Icon && (
        <span className={`${styles.badge} ${styles[tone]}`} aria-hidden="true">
          <Icon size={24} strokeWidth={1.8} />
        </span>
      )}
      <h1 className={styles.title}>{title}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}
    </header>
  )
}

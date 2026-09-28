import clsx from 'clsx'
import styles from './Tag.module.css'

/** Small label for diet types and statuses. tone: leaf | ember | sky | plum | neutral */
export default function Tag({ tone = 'neutral', className, children }) {
  return <span className={clsx(styles.tag, styles[tone], className)}>{children}</span>
}

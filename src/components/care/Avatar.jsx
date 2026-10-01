import clsx from 'clsx'
import styles from './Care.module.css'

/** Initials in the colour of the professional's specialty, until real photos are added. */
export default function Avatar({ professional, size = 'md' }) {
  const initials = professional.name
    .replace(/^Dr\s+/, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span className={clsx(styles.avatar, styles[`avatar_${professional.specialty}`], styles[`avatar_${size}`])} aria-hidden="true">
      {initials}
    </span>
  )
}

import { Link } from 'react-router-dom'
import clsx from 'clsx'
import styles from './Button.module.css'

/**
 * Buttons carry meaning through colour:
 *  - primary (leaf): main actions, progress
 *  - action (ember): meals, plans, add to basket
 *  - care (sky):     consultations, records
 *  - outline:        secondary actions
 * Pass `to` to render a router link styled as a button.
 */
export default function Button({ variant = 'primary', size = 'md', to, className, children, ...rest }) {
  const classes = clsx(styles.button, styles[variant], styles[size], className)

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

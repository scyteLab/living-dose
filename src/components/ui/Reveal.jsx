import { useRef } from 'react'
import clsx from 'clsx'
import useInView from '@/hooks/useInView'
import styles from './Reveal.module.css'

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * `delay` (ms) staggers items in a row. Renders any element via `as`.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className, style, children, ...rest }) {
  const ref = useRef(null)
  const inView = useInView(ref)

  return (
    <Tag
      ref={ref}
      className={clsx(styles.reveal, inView && styles.visible, className)}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

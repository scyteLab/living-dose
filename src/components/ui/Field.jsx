import { cloneElement, useId } from 'react'
import clsx from 'clsx'
import styles from './Field.module.css'

/**
 * Label + control + hint/error, wired up for screen readers.
 * Pass a single <input>, <select> or <textarea> as the child:
 *   <Field label="Email" error={errors.email}><input type="email" /></Field>
 */
export default function Field({ label, hint, error, optionalLabel, className, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  const control = cloneElement(children, {
    id,
    className: clsx(styles.control, children.props.className),
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
  })

  return (
    <div className={clsx(styles.field, error && styles.hasError, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optionalLabel && <span className={styles.optional}> {optionalLabel}</span>}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

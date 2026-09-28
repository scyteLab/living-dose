import clsx from 'clsx'
import styles from './Checkbox.module.css'

/** A large, card-style checkbox. The whole card is the label, so it's easy to tap. */
export default function Checkbox({ checked, onChange, error, children, id }) {
  return (
    <label className={clsx(styles.card, checked && styles.checked, error && styles.error)} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={error ? true : undefined}
      />
      <span className={styles.text}>{children}</span>
    </label>
  )
}

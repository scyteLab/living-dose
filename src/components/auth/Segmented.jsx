import clsx from 'clsx'
import styles from './Segmented.module.css'

/** Two or three side-by-side choices, like "Phone number | Email". */
export default function Segmented({ label, options, value, onChange }) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map(({ value: v, label: text, icon: Icon }) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          className={clsx(styles.option, value === v && styles.on)}
          onClick={() => onChange(v)}
        >
          {Icon && <Icon size={17} strokeWidth={2} aria-hidden="true" />}
          {text}
        </button>
      ))}
    </div>
  )
}

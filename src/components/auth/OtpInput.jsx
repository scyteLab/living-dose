import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import styles from './OtpInput.module.css'

/**
 * Six code boxes backed by ONE real input, so typing, pasting, deleting
 * and phones' "fill from message" (autocomplete="one-time-code") all just work.
 * Calls onComplete(code) when the last digit is entered.
 */
const OtpInput = forwardRef(function OtpInput(
  { value, onChange, onComplete, length = 6, label, error, disabled, describedBy },
  ref,
) {
  const [focused, setFocused] = useState(false)

  const handleChange = (e) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, length)
    onChange(next)
    if (next.length === length && value.length !== length) onComplete?.(next)
  }

  return (
    <div className={clsx(styles.wrap, error && styles.hasError, disabled && styles.disabled)}>
      <div className={styles.boxes} aria-hidden="true">
        {Array.from({ length }, (_, i) => {
          const filled = i < value.length
          const active = focused && !disabled && value.length < length && i === value.length
          return (
            <span key={i} className={clsx(styles.box, filled && styles.filled, active && styles.active)}>
              {value[i] ?? ''}
              {active && <span className={styles.caret} />}
            </span>
          )
        })}
      </div>
      <input
        ref={ref}
        className={styles.input}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
      />
    </div>
  )
})

export default OtpInput

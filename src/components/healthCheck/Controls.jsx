import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import clsx from 'clsx'
import styles from './Controls.module.css'

/**
 * Single choice shown as tappable cards, built on native radio buttons
 * (arrow keys move between options; screen readers announce the group).
 * options: [{ value, label }]
 */
export function ChoiceGroup({ legend, help, options, value, onChange, columns }) {
  const name = useId()
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {help && <p className={styles.help}>{help}</p>}
      <div className={styles.choices} style={{ '--cols': columns ?? options.length }}>
        {options.map((o) => (
          <label key={o.value} className={clsx(styles.choice, value === o.value && styles.choiceOn)}>
            <input
              type="radio"
              className={styles.hiddenInput}
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Several choices as chips (checkboxes). */
export function MultiChoice({ legend, help, options, values, onToggle }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {help && <p className={styles.help}>{help}</p>}
      <div className={styles.chips}>
        {options.map((o) => {
          const on = values.includes(o.value)
          return (
            <label key={o.value} className={clsx(styles.chip, on && styles.chipOn)}>
              <input type="checkbox" className={styles.hiddenInput} checked={on} onChange={() => onToggle(o.value)} />
              <span>{o.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Large number input with a unit on the right, e.g. "165 cm". */
export function NumberField({ label, labelExtra, unit, value, onChange, placeholder, error, hint, maxLength = 5, inputMode = 'decimal', autoFocus }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={styles.numberField}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {labelExtra && <span className={styles.labelExtra}> {labelExtra}</span>}
      </label>
      <div className={clsx(styles.numberBox, error && styles.numberError)}>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          placeholder={placeholder}
          value={value ?? ''}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className={styles.help}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Slider with a target marker (e.g. the WHO 150-minute line). */
export function RangeField({ label, help, value, min, max, step, onChange, display, valueText, markerPct, markerLabel, minLabel, maxLabel, status }) {
  const id = useId()
  return (
    <div className={styles.panel}>
      <div className={styles.rangeHead}>
        <label htmlFor={id} className={styles.legend}>
          {label}
        </label>
        <span className={styles.bigValue} aria-hidden="true">
          {display}
        </span>
      </div>
      {help && <p className={styles.help}>{help}</p>}
      <input
        id={id}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueText}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
      />
      <div className={styles.rangeScale} aria-hidden="true">
        <span>{minLabel}</span>
        <span className={styles.marker} style={{ left: `${markerPct}%` }}>
          {markerLabel}
        </span>
        <span>{maxLabel}</span>
      </div>
      {status}
    </div>
  )
}

/** − value + counter, e.g. hours of sleep. */
export function Counter({ label, value, unit, onDecrease, onIncrease, decreaseLabel, increaseLabel, status }) {
  const id = useId()
  return (
    <div className={clsx(styles.panel, styles.counterPanel)}>
      <div className={styles.counterText}>
        <span id={id} className={styles.legend}>
          {label}
        </span>
        {status}
      </div>
      <div role="group" aria-labelledby={id} className={styles.counter}>
        <button type="button" className={styles.counterButton} onClick={onDecrease} aria-label={decreaseLabel}>
          <Minus size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <span className={styles.counterValue} aria-live="polite">
          {value}
          <small> {unit}</small>
        </span>
        <button type="button" className={styles.counterButton} onClick={onIncrease} aria-label={increaseLabel}>
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Coloured bands with a marker showing where a value falls. `segments`: [{ size, colour, label }] */
export function GuidelineScale({ segments, markerPct }) {
  return (
    <div className={styles.scale} aria-hidden="true">
      <div className={styles.scaleTrack}>
        <div className={styles.scaleBars}>
          {segments.map((s, i) => (
            <span key={i} style={{ width: `${s.size}%`, background: s.colour }} />
          ))}
        </div>
        {markerPct != null && <span className={styles.scaleMarker} style={{ left: `${Math.min(99, Math.max(1, markerPct))}%` }} />}
      </div>
      <div className={styles.scaleLabels}>
        {segments.map((s, i) => (
          <span key={i} style={{ width: `${s.size}%` }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Dark card for live results beside the questions. */
export function LiveCard({ title, children }) {
  return (
    <div className={styles.live} aria-live="polite">
      {title && <p className={styles.liveTitle}>{title}</p>}
      {children}
    </div>
  )
}

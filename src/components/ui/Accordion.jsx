import { ChevronDown } from 'lucide-react'
import styles from './Accordion.module.css'

/**
 * A list of questions that open and close.
 * Built on native <details>, so it works with keyboard, screen readers
 * and even before JavaScript loads. `items`: [{ id, question, answer }]
 */
export default function Accordion({ items }) {
  return (
    <div className={styles.list}>
      {items.map(({ id, question, answer }) => (
        <details key={id} id={id} className={styles.item}>
          <summary className={styles.summary}>
            <span className={styles.question}>{question}</span>
            <ChevronDown className={styles.chevron} size={20} strokeWidth={2} aria-hidden="true" />
          </summary>
          <div className={styles.answer}>
            {(Array.isArray(answer) ? answer : [answer]).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import styles from './Dashboard.module.css'

export default function CardHead({ id, title, link, to }) {
  return (
    <div className={styles.cardHead}>
      <h2 id={id} className={styles.cardTitle}>
        {title}
      </h2>
      {link && (
        <Link to={to} className={styles.cardLink}>
          {link}
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import Tag from '@/components/ui/Tag'
import styles from './Results.module.css'

const TONE = { eating: 'ember', activity: 'sky', body: 'leaf', sleep: 'plum', mind: 'plum', habits: 'leaf' }
const LINK = {
  vegetables: '/learn',
  moveMore: '/plan',
  sugaryDrinks: '/plan',
  lessSalt: '/learn',
  lessFried: '/learn',
  wholeGrains: '/shop',
  strength: '/learn',
  sleep: '/learn',
  alcohol: '/care',
  weight: '/care',
  stopSmoking: '/care',
  talkToSomeone: '/care',
  keepGoing: '/learn',
}

export default function Priorities({ priorities }) {
  const { t } = useTranslation('healthCheck')
  return (
    <section className={styles.block} aria-labelledby="priorities-title">
      <div className={styles.blockHead}>
        <h2 id="priorities-title" className={styles.blockTitle}>
          {t('results.prioritiesTitle')}
        </h2>
        <p className={styles.blockIntro}>{t('results.prioritiesIntro')}</p>
      </div>
      <ol className={styles.priorities}>
        {priorities.map(({ id, pillar, params }, i) => (
          <li key={id} className={styles.priority}>
            <div className={styles.priorityHead}>
              <span className={styles.priorityNum}>{i + 1}</span>
              <Tag tone={TONE[pillar]}>{t(`pillars.${pillar}`)}</Tag>
            </div>
            <h3 className={styles.priorityTitle}>{t(`results.priorities.${id}.title`, params)}</h3>
            <p className={styles.priorityBody}>{t(`results.priorities.${id}.body`, params)}</p>
            <Link to={LINK[id]} className={styles.priorityLink}>
              {t(`results.priorities.${id}.cta`)}
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

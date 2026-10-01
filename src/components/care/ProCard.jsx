import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, CalendarClock, Languages } from 'lucide-react'
import Tag from '@/components/ui/Tag'
import { relativeWhen } from '@/lib/care/format'
import Avatar from './Avatar'
import { TYPE_ICON } from './typeIcons'
import styles from './Care.module.css'

export default function ProCard({ professional: p, next }) {
  const { t, i18n } = useTranslation('care')
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <Avatar professional={p} />
        <div className={styles.cardWho}>
          <h3 className={styles.cardName}>
            <Link to={`/care/${p.id}`} className={styles.cardLink}>
              {p.name}
            </Link>
          </h3>
          <p className={styles.cardTitle}>{p.title}</p>
          <p className={styles.verified}>
            <BadgeCheck size={15} strokeWidth={2.2} aria-hidden="true" />
            {t('verified')}
          </p>
        </div>
      </div>
      <div className={styles.cardTags}>
        {p.focus.slice(0, 3).map((f) => (
          <Tag key={f}>{t(`focus.${f}`)}</Tag>
        ))}
      </div>
      <ul className={styles.cardFacts}>
        <li>
          <Languages size={16} strokeWidth={2} aria-hidden="true" />
          {p.languages.join(', ')}
        </li>
        <li>
          <span className={styles.typeIcons}>
            {p.types.map((type) => {
              const Icon = TYPE_ICON[type]
              return <Icon key={type} size={16} strokeWidth={2} aria-label={t(`types.${type}`)} />
            })}
          </span>
          {p.types.map((type) => t(`types.${type}`)).join(', ')}
        </li>
      </ul>
      <p className={styles.next}>
        <CalendarClock size={17} strokeWidth={2} aria-hidden="true" />
        {next ? t('next', { time: relativeWhen(next, i18n.language, t) }) : t('noSlots')}
      </p>
      <span className={styles.cardCta} aria-hidden="true">
        {t('viewProfile')}
      </span>
    </article>
  )
}

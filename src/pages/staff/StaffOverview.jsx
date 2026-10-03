import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ClipboardCheck, Flag, Package, Video } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import { ARTICLES } from '@/data/articles'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { staffOverview } from '@/lib/staff/service'
import { formatPrice } from '@/lib/shop/money'

export default function StaffOverview() {
  const { t } = useTranslation('staff')
  useDocumentTitle(t('docTitle'))
  const { data: o, error } = useStaffData(staffOverview)
  if (error) return <p className={styles.empty}>{t('loadError')}</p>
  if (!o) return <div className={styles.loading} role="status" />
  const awaiting = ARTICLES.filter((a) => !a.reviewedBy).length

  const cards = [
    { icon: Package, tone: 'ember', value: o.openOrders, label: t('overview.openOrders'), sub: `${o.toPack} ${t('overview.toPack')} · ${t('overview.ordersToday')}: ${o.ordersToday}`, to: '/staff/orders', cta: t('overview.goOrders') },
    { icon: Package, tone: 'leaf', value: formatPrice(o.cashDue), label: t('overview.cashDue'), to: '/staff/orders', cta: t('overview.goOrders') },
    { icon: Video, tone: 'sky', value: o.upcomingAppointments, label: t('overview.appointments'), sub: `${o.next24h} ${t('overview.next24h')}`, to: '/staff/appointments', cta: t('overview.goAppointments') },
    { icon: Flag, tone: 'berry', value: o.openReports, label: t('overview.reports'), to: '/staff/moderation', cta: t('overview.goModeration') },
    { icon: ClipboardCheck, tone: 'plum', value: awaiting, label: t('overview.review'), to: '/staff/content', cta: t('overview.goContent') },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('overview.title')}</h1>
      <ul className={styles.stats}>
        {cards.map(({ icon: Icon, tone, value, label, sub, to, cta }) => (
          <li key={label} className={styles.stat}>
            <span className={`${styles.statIcon} ${styles[`tone_${tone}`]}`} aria-hidden="true">
              <Icon size={20} strokeWidth={2} />
            </span>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statLabel}>{label}</p>
            {sub && <p className={styles.small}>{sub}</p>}
            <Link to={to} className={styles.statLink}>
              {cta}
              <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

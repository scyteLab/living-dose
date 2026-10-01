import { useTranslation } from 'react-i18next'
import { Check, House, Package, PackageCheck, Truck } from 'lucide-react'
import clsx from 'clsx'
import { STATUSES } from '@/lib/shop/orders'
import styles from './Shop.module.css'

const ICONS = { placed: PackageCheck, packed: Package, onTheWay: Truck, delivered: House }

export default function OrderTimeline({ status }) {
  const { t } = useTranslation('shop')
  const current = STATUSES.indexOf(status)
  return (
    <ol className={styles.timeline}>
      {STATUSES.map((s, i) => {
        const Icon = i < current ? Check : ICONS[s]
        return (
          <li key={s} className={clsx(styles.timeStep, i < current && styles.timeDone, i === current && styles.timeNow)} aria-current={i === current ? 'step' : undefined}>
            <span className={styles.timeDot} aria-hidden="true">
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className={styles.timeText}>
              <strong>{t(`order.status.${s}`)}</strong>
              <span>{t(`order.statusHint.${s}`)}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

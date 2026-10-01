import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, Package, Truck } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { ARTICLE_FOR_PRIORITY } from '@/data/articles'
import { STATUSES } from '@/lib/shop/orders'
import { daysLeftInWeek, weekMinutes } from '@/lib/dashboard/insights'
import CardHead from './CardHead'
import styles from './Dashboard.module.css'

const PILLAR_TONE = { eating: 'ember', activity: 'sky', body: 'leaf', sleep: 'plum', mind: 'plum', habits: 'leaf' }

/** The top priority from the health check, with progress where it can be measured. */
export function WeeklyFocus({ record, habits }) {
  const { t } = useTranslation('dashboard')
  const tc = useTranslation('healthCheck').t
  const priorities = record?.results?.priorities ?? []
  const top = priorities[0]

  if (!top) {
    return (
      <section className={styles.card} aria-labelledby="focus-h">
        <CardHead id="focus-h" title={t('focus.title')} />
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('focus.none')}</p>
          <p className={styles.muted}>{t('focus.noneBody')}</p>
        </div>
      </section>
    )
  }

  const minutes = weekMinutes(habits)
  const left = daysLeftInWeek()
  return (
    <section className={styles.card} aria-labelledby="focus-h">
      <CardHead id="focus-h" title={t('focus.title')} link={t('focus.all')} to="/health-check/results" />
      <div className={styles.focusTags}>
        <Tag tone={PILLAR_TONE[top.pillar]}>{tc(`pillars.${top.pillar}`)}</Tag>
        <span className={styles.muted}>{t('focus.of', { n: 1, total: priorities.length })}</span>
      </div>
      <p className={styles.focusTitle}>{tc(`results.priorities.${top.id}.title`, top.params)}</p>
      {top.id === 'moveMore' ? (
        <>
          <div className={styles.focusProgress}>
            <span>
              <strong>{t('focus.minutes', { done: minutes })}</strong>
            </span>
            <span className={styles.muted}>{t('focus.daysLeft', { count: left })}</span>
          </div>
          <span className={styles.bar} aria-hidden="true">
            <span className={styles.barSky} style={{ width: `${Math.min(100, (minutes / 150) * 100)}%` }} />
          </span>
          <p className={styles.muted}>{minutes ? t('focus.moveTip') : t('focus.logHint')}</p>
        </>
      ) : (
        <p className={styles.muted}>{tc(`results.priorities.${top.id}.body`, top.params)}</p>
      )}
    </section>
  )
}

/** The latest order still on its way. */
export function OrderCard({ order }) {
  const { t, i18n } = useTranslation('dashboard')
  const ts = useTranslation('shop').t

  if (!order) {
    return (
      <section className={styles.card} aria-labelledby="order-h">
        <CardHead id="order-h" title={t('order.none')} />
        <p className={styles.muted}>{t('order.noneBody')}</p>
        <Button to="/shop" variant="primary" size="sm" className={styles.selfStart}>
          {t('order.noneCta')}
        </Button>
      </section>
    )
  }

  const current = STATUSES.indexOf(order.status)
  const [date, slotWindow] = order.slot.split('|')
  const [y, m, d] = date.split('-').map(Number)
  const day = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
  const items = order.items.reduce((n, i) => n + i.qty, 0)
  const steps = [
    { s: 'placed', icon: Check },
    { s: 'packed', icon: Package },
    { s: 'onTheWay', icon: Truck },
  ]

  return (
    <section className={styles.card} aria-labelledby="order-h">
      <CardHead id="order-h" title={t('order.title')} link={t('order.track')} to={`/orders/${order.id}`} />
      <div className={styles.orderTop}>
        <span className={styles.orderId}>{order.id}</span>
        <span className={styles.muted}>{t('order.items', { count: items })}</span>
      </div>
      <ol className={styles.orderSteps}>
        {steps.map(({ s, icon: Icon }, i) => (
          <li key={s} className={clsx(i < current && styles.stepDone, i === current && styles.stepNow)} aria-current={i === current ? 'step' : undefined}>
            <span className={styles.stepDot} aria-hidden="true">
              <Icon size={13} strokeWidth={2.6} />
            </span>
            {ts(`order.status.${s}`)}
          </li>
        ))}
      </ol>
      <p className={styles.orderNote}>
        {t('order.arriving', { date: day, window: t(`order.windows.${slotWindow}`) })} · {t('order.pay')}
      </p>
    </section>
  )
}

/** A reading suggestion based on the top priority (Learn articles to come). */
export function ReadCard({ record }) {
  const { t } = useTranslation('dashboard')
  const id = record?.results?.priorities?.find((p) => p.id === 'lessSalt')?.id ?? record?.results?.priorities?.[0]?.id ?? 'keepGoing'
  return (
    <section className={styles.read} aria-labelledby="read-h">
      <p id="read-h" className={styles.readLabel}>
        {t('read.label')}
      </p>
      <p className={styles.readTitle}>{t(`read.items.${id}`)}</p>
      <p className={styles.readBody}>{t('read.because')}</p>
      <Link to={`/learn/${ARTICLE_FOR_PRIORITY[id]}`} className={styles.readLink}>
        {t('read.cta')}
        <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </section>
  )
}

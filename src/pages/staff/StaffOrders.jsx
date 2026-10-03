import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Search } from 'lucide-react'
import clsx from 'clsx'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { nextStatus } from '@/lib/staff/api'
import { staffOrders, staffSetOrderStatus } from '@/lib/staff/service'
import { formatPrice } from '@/lib/shop/money'

const FILTERS = ['open', 'placed', 'packed', 'onTheWay', 'delivered', 'cancelled', 'all']
const TONE = { placed: 'ember', packed: 'sky', onTheWay: 'plum', delivered: 'leaf', cancelled: 'berry' }

export default function StaffOrders() {
  const { t, i18n } = useTranslation('staff')
  useDocumentTitle(t('orders.title'))
  const { data, error, refresh, staff } = useStaffData(staffOrders)
  const orders = data ?? []
  const [actionError, setActionError] = useState(false)
  const [filter, setFilter] = useState('open')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })
  const timeFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const shown = orders.filter((o) => {
    const inFilter = filter === 'all' || (filter === 'open' ? !['delivered', 'cancelled'].includes(o.status) : o.status === filter)
    const hay = `${o.id} ${o.address?.name ?? ''} ${o.address?.phone ?? ''} ${o.address?.area ?? ''}`.toLowerCase()
    return inFilter && words.every((w) => hay.includes(w))
  })
  const current = orders.find((o) => o.id === openId)

  const move = async (o, status) => {
    try {
      setActionError(false)
      await staffSetOrderStatus(o, status, staff)
    } catch {
      setActionError(true)
    }
    refresh()
  }

  const slotText = (o) => {
    const [date, win] = (o.slot ?? '').split('|')
    if (!date) return '–'
    const [y, m, d] = date.split('-').map(Number)
    return `${dayFmt.format(new Date(y, m - 1, d))}, ${win}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>{t('orders.title')}</h1>
        <div className={styles.search}>
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <label htmlFor="order-search" className="sr-only">
            {t('orders.search')}
          </label>
          <input id="order-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('orders.searchPlaceholder')} />
        </div>
      </div>
      <div className={styles.filters} role="group" aria-label={t('orders.title')}>
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} className={clsx(styles.filter, filter === f && styles.filterOn)} onClick={() => setFilter(f)}>
            {t(`orders.filters.${f}`)}
          </button>
        ))}
      </div>
      {(error || actionError) && (
        <p className={styles.errorText} role="alert">
          {error ? t('loadError') : t('actionError')}
        </p>
      )}
      <p className={styles.small} aria-live="polite">
        {t('orders.count', { count: shown.length })}
      </p>

      {shown.length === 0 ? (
        <p className={styles.empty}>{t('orders.empty')}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('orders.cols.order')}</th>
                <th scope="col">{t('orders.cols.customer')}</th>
                <th scope="col">{t('orders.cols.delivery')}</th>
                <th scope="col">{t('orders.cols.total')}</th>
                <th scope="col">{t('orders.cols.status')}</th>
                <th scope="col">{t('orders.cols.action')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const next = o.status === 'cancelled' ? null : nextStatus(o.status)
                return (
                  <tr key={o.id}>
                    <th scope="row">
                      <button type="button" className={styles.rowLink} onClick={() => setOpenId(o.id)}>
                        {o.id}
                      </button>
                      <span className={styles.small}>{timeFmt.format(new Date(o.createdAt))}</span>
                    </th>
                    <td>
                      {o.address?.name}
                      <span className={styles.small}>{o.address?.area}</span>
                    </td>
                    <td>{slotText(o)}</td>
                    <td className={styles.num}>{formatPrice(o.total)}</td>
                    <td>
                      <Tag tone={TONE[o.status]}>{t(`orders.status.${o.status}`)}</Tag>
                      <span className={styles.small}>{t(`orders.payment.${o.paymentStatus ?? 'dueOnDelivery'}`)}</span>
                    </td>
                    <td>
                      {next && o.payment === 'paystack' && o.paymentStatus !== 'paid' ? (
                        <span className={styles.small}>{t('orders.payment.pending')}</span>
                      ) : next ? (
                        <Button size="sm" variant={next === 'delivered' ? 'primary' : 'outline'} onClick={() => move(o, next)}>
                          {t(`orders.advance.${next}`)}
                        </Button>
                      ) : (
                        <button type="button" className={styles.rowLink} onClick={() => setOpenId(o.id)}>
                          {t('orders.view')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(current)} onClose={() => setOpenId(null)} title={current ? t('orders.detail.title', { id: current.id }) : ''} closeLabel={t('orders.detail.close')} size="lg">
        {current && (
          <div className={styles.detail}>
            <Tag tone={TONE[current.status]}>{t(`orders.status.${current.status}`)}</Tag>
            <section>
              <h3 className={styles.detailTitle}>{t('orders.detail.customer')}</h3>
              <p>
                {current.address?.name} · {current.address?.street}, {current.address?.area}, {current.address?.city}
                {current.address?.landmark && ` (${current.address.landmark})`}
              </p>
              {current.address?.phone && (
                <a href={`tel:${current.address.phone.replace(/[^\d+]/g, '')}`} className={styles.call}>
                  <Phone size={16} strokeWidth={2} aria-hidden="true" />
                  {t('orders.detail.call')} {current.address.phone}
                </a>
              )}
              {current.note && (
                <p className={styles.note}>
                  <strong>{t('orders.detail.note')}:</strong> {current.note}
                </p>
              )}
            </section>
            <section>
              <h3 className={styles.detailTitle}>{t('orders.detail.items')}</h3>
              <ul className={styles.items}>
                {current.items.map((it) => (
                  <li key={it.productId}>
                    <span>
                      {it.qty} × {it.name} <span className={styles.small}>({it.unit})</span>
                    </span>
                    <span className={styles.num}>{formatPrice(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.total}>{current.paid ? t('orders.detail.paid') : t('orders.detail.payment', { amount: formatPrice(current.total) })}</p>
            </section>
            {current.history?.length > 0 && (
              <section>
                <h3 className={styles.detailTitle}>{t('orders.detail.history')}</h3>
                <ol className={styles.history}>
                  {current.history.map((h) => (
                    <li key={`${h.status}-${h.at}`}>
                      {t(`orders.status.${h.status}`)} · {timeFmt.format(new Date(h.at))}
                      {h.by && ` · ${h.by}`}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {!['delivered', 'cancelled'].includes(current.status) && (
              <div className={styles.detailActions}>
                <Button onClick={() => move(current, nextStatus(current.status))}>
                  {t(`orders.advance.${nextStatus(current.status)}`)}
                </Button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => {
                    if (window.confirm(t('orders.detail.cancelConfirm', { id: current.id }))) move(current, 'cancelled')
                  }}
                >
                  {t('orders.detail.cancel')}
                </button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}

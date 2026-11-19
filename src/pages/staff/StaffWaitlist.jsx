import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ambulance, CalendarPlus, Download, MapPin, Mail } from 'lucide-react'
import clsx from 'clsx'
import Button from '@/components/ui/Button'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { orgsToCsv, staffInbox, summarise, summariseOrgs, toCsv } from '@/lib/staff/waitlist'

function Bars({ title, rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className={styles.panel}>
      <h2 className={styles.dayTitle}>{title}</h2>
      <ul className={styles.bars}>
        {rows.map((r) => (
          <li key={r.key}>
            <span className={styles.barLabel}>{label(r.key)}</span>
            <span className={styles.barTrack} aria-hidden="true">
              <span style={{ width: `${(r.count / max) * 100}%` }} />
            </span>
            <span className={styles.barValue}>{r.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** /staff/waitlist: who has joined the Shuttle Meds waitlist, and other Contact messages. */
export default function StaffWaitlist() {
  const { t, i18n } = useTranslation('staff')
  const tShuttle = useTranslation('shuttle').t
  useDocumentTitle(t('waitlist.title'))
  const { data, error } = useStaffData(staffInbox)
  const [tab, setTab] = useState('waitlist')
  const [state, setState] = useState('all')
  const fmt = useMemo(() => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }), [i18n.language])

  if (error) return <p className={styles.empty}>{t('waitlist.loadError')}</p>
  if (!data) return <div className={styles.loading} role="status" />

  const sum = summarise(data.waitlist)
  const shown = state === 'all' ? data.waitlist : data.waitlist.filter((e) => e.state === state)
  const interest = (id) => tShuttle(`services.${id}.title`)

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>{t('waitlist.title')}</h1>
        {tab === 'waitlist' && data.waitlist.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => download(`shuttle-meds-waitlist-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(shown))}>
            <Download size={16} strokeWidth={2} aria-hidden="true" />
            {t('waitlist.download')}
          </Button>
        )}
        {tab === 'orgs' && data.orgs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              download(
                `shuttle-meds-requests-${new Date().toISOString().slice(0, 10)}.csv`,
                orgsToCsv(data.orgs, (x) => tShuttle(`settings.${x}`, { defaultValue: x })),
              )
            }
          >
            <Download size={16} strokeWidth={2} aria-hidden="true" />
            {t('waitlist.download')}
          </Button>
        )}
      </div>
      <p className={styles.muted}>{t('waitlist.intro')}</p>

      <div className={styles.filters} role="group" aria-label={t('waitlist.tabsLabel')}>
        {['waitlist', 'orgs', 'messages'].map((id) => (
          <button key={id} type="button" className={clsx(styles.filter, tab === id && styles.filterOn)} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {t(`waitlist.tabs.${id}`, { count: data[id].length })}
          </button>
        ))}
      </div>

      {tab === 'orgs' ? (
        <OrgRequests orgs={data.orgs} fmt={fmt} />
      ) : tab === 'waitlist' ? (
        data.waitlist.length === 0 ? (
          <p className={styles.empty}>{t('waitlist.empty')}</p>
        ) : (
          <>
            <ul className={styles.stats}>
              {[
                { icon: Ambulance, tone: 'berry', value: sum.total, label: t('waitlist.stats.total') },
                { icon: CalendarPlus, tone: 'leaf', value: sum.lastWeek, label: t('waitlist.stats.lastWeek') },
                { icon: MapPin, tone: 'sky', value: sum.states, label: t('waitlist.stats.states') },
              ].map(({ icon: Icon, tone, value, label }) => (
                <li key={label} className={styles.stat}>
                  <span className={`${styles.statIcon} ${styles[`tone_${tone}`]}`} aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <p className={styles.statValue}>{value}</p>
                  <p className={styles.statLabel}>{label}</p>
                </li>
              ))}
            </ul>

            <div className={styles.orgGrid}>
              <Bars title={t('waitlist.byState')} rows={sum.byState.slice(0, 8)} label={(k) => k} />
              <Bars title={t('waitlist.byInterest')} rows={sum.byInterest} label={interest} />
              <Bars title={t('waitlist.byWho')} rows={sum.byWho} label={(k) => tShuttle(`form.whoOptions.${k}`, { defaultValue: k })} />
            </div>

            <div className={styles.filters} role="group" aria-label={t('waitlist.stateFilter')}>
              {['all', ...sum.byState.map((s) => s.key)].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={clsx(styles.filter, state === s && styles.filterOn)}
                  aria-pressed={state === s}
                  onClick={() => setState(s)}
                >
                  {s === 'all' ? t('waitlist.allStates') : s}
                </button>
              ))}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('waitlist.cols.when')}</th>
                    <th scope="col">{t('waitlist.cols.name')}</th>
                    <th scope="col">{t('waitlist.cols.contact')}</th>
                    <th scope="col">{t('waitlist.cols.where')}</th>
                    <th scope="col">{t('waitlist.cols.interests')}</th>
                    <th scope="col">{t('waitlist.cols.who')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id}>
                      <th scope="row">{fmt.format(new Date(e.at))}</th>
                      <td>{e.name}</td>
                      <td>{e.contact}</td>
                      <td>{[e.state, e.community].filter(Boolean).join(', ')}</td>
                      <td>{e.interests.length ? e.interests.map(interest).join(', ') : t('waitlist.everything')}</td>
                      <td>{tShuttle(`form.whoOptions.${e.who}`, { defaultValue: e.who })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : data.messages.length === 0 ? (
        <p className={styles.empty}>{t('waitlist.noMessages')}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('waitlist.cols.when')}</th>
                <th scope="col">{t('waitlist.cols.name')}</th>
                <th scope="col">{t('waitlist.cols.topic')}</th>
                <th scope="col">{t('waitlist.cols.message')}</th>
              </tr>
            </thead>
            <tbody>
              {data.messages.map((m) => (
                <tr key={m.id}>
                  <th scope="row">{fmt.format(new Date(m.at))}</th>
                  <td>
                    {m.name}
                    <br />
                    <a href={`mailto:${m.email}`} className={styles.small}>
                      <Mail size={12} strokeWidth={2} aria-hidden="true" /> {m.email}
                    </a>
                    {m.phone && <span className={styles.small}> · {m.phone}</span>}
                  </td>
                  <td>{t(`translation:contact.topics.${m.topic}`, { defaultValue: m.topic })}</td>
                  <td style={{ whiteSpace: 'pre-wrap', minWidth: '16rem' }}>{m.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** "Bring Shuttle Meds to your place" requests from organisations. */
function OrgRequests({ orgs, fmt }) {
  const { t } = useTranslation('staff')
  const tShuttle = useTranslation('shuttle').t
  if (orgs.length === 0) return <p className={styles.empty}>{t('waitlist.noOrgs')}</p>
  const sum = summariseOrgs(orgs)
  return (
    <>
      <div className={styles.orgGrid}>
        <Bars title={t('waitlist.byPlace')} rows={sum.byGroup} label={(k) => tShuttle(`groups.${k}.title`, { defaultValue: k })} />
        <Bars title={t('waitlist.byState')} rows={sum.byState.slice(0, 8)} label={(k) => k} />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('waitlist.cols.when')}</th>
              <th scope="col">{t('waitlist.cols.org')}</th>
              <th scope="col">{t('waitlist.cols.place')}</th>
              <th scope="col">{t('waitlist.cols.where')}</th>
              <th scope="col">{t('waitlist.cols.size')}</th>
              <th scope="col">{t('waitlist.cols.needs')}</th>
              <th scope="col">{t('waitlist.cols.message')}</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((e) => (
              <tr key={e.id}>
                <th scope="row">{fmt.format(new Date(e.at))}</th>
                <td>
                  <strong>{e.org}</strong>
                  <br />
                  <span className={styles.small}>
                    {e.person} · {e.contact}
                  </span>
                </td>
                <td>{tShuttle(`settings.${e.setting}`, { defaultValue: e.setting })}</td>
                <td>{[e.state, e.town].filter(Boolean).join(', ')}</td>
                <td>{e.size ? tShuttle(`org.sizes.${e.size}`, { defaultValue: e.size }) : ''}</td>
                <td>{e.needs.length ? e.needs.map((n) => tShuttle(`services.${n}.title`)).join(', ') : t('waitlist.everything')}</td>
                <td style={{ whiteSpace: 'pre-wrap', minWidth: '14rem' }}>{e.message.split('\n\n').slice(1).join('\n\n')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

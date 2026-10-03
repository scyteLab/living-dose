import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, Lock, ShieldCheck } from 'lucide-react'
import styles from '@/components/staff/Staff.module.css'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { aggregate, sampleCohort, toCsv } from '@/lib/org/aggregate'
import { organisationStats } from '@/lib/org/service'

const BAND_COLOUR = { strong: 'var(--leaf)', good: 'var(--sky)', grow: 'var(--ember)', attention: '#e0738a' }
const PILLARS = ['eating', 'activity', 'body', 'sleep', 'mind', 'habits']

export default function OrgOverview() {
  const { org, sample } = useOutletContext()
  const { t, i18n } = useTranslation('org')
  const th = useTranslation('healthCheck').t
  useDocumentTitle(t('overview.title'))

  const [real, setReal] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (sample) return
    let alive = true
    organisationStats(org.id)
      .then((s) => alive && (setReal(s), setFailed(false)))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [org.id, sample])
  const stats = sample ? aggregate(sampleCohort().records, sampleCohort().enrolled) : real
  if (failed && !sample) return <p className={styles.empty}>{t('overview.failed')}</p>
  if (!stats) return <div className={styles.loading} role="status" aria-label={t('overview.title')} />

  const labels = {
    bands: t('overview.bandNames', { returnObjects: true }),
    pillars: Object.fromEntries(PILLARS.map((p) => [p, th(`pillars.${p}`)])),
    risks: t('overview.riskNames', { returnObjects: true }),
    priorities: new Proxy({}, { get: (_, id) => th(`results.priorities.${String(id)}.title`, { minutes: '', gap: '', now: '' }) }),
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(org, stats, labels)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `living-dose-${org.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>{t('overview.title')}</h1>
          <p className={styles.small}>{t('overview.asOf', { date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={download}>
          <Download size={17} strokeWidth={2} aria-hidden="true" />
          {t('overview.download')}
        </Button>
      </div>
      <p className={styles.guide}>
        <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
        {t('privacy')}
      </p>

      <ul className={styles.stats}>
        <li className={styles.stat}>
          <p className={styles.statValue}>{stats.enrolled}</p>
          <p className={styles.statLabel}>{t('overview.enrolled')}</p>
          <p className={styles.small}>{t('overview.seats', { count: org.seats })}</p>
        </li>
        <li className={styles.stat}>
          <p className={styles.statValue}>{stats.checked}</p>
          <p className={styles.statLabel}>{t('overview.checked')}</p>
          <p className={styles.small}>{t('overview.participation', { pct: stats.participation })}</p>
        </li>
        {!stats.suppressed && (
          <li className={styles.stat}>
            <p className={styles.statValue}>{stats.averageScore}</p>
            <p className={styles.statLabel}>{t('overview.average')}</p>
          </li>
        )}
      </ul>

      {stats.suppressed ? (
        <section className={styles.panel}>
          <h2 className={styles.dayTitle}>
            <Lock size={18} strokeWidth={2} aria-hidden="true" />
            {t('overview.suppressedTitle')}
          </h2>
          <p className={styles.muted}>{t('overview.suppressedBody', { count: stats.needed })}</p>
        </section>
      ) : (
        <div className={styles.orgGrid}>
          <section className={styles.panel} aria-labelledby="bands-h">
            <h2 id="bands-h" className={styles.dayTitle}>
              {t('overview.bands')}
            </h2>
            <div className={styles.stack} role="img" aria-label={Object.entries(stats.bands).map(([b, v]) => `${labels.bands[b]}: ${v.hidden ? t('overview.fewer') : `${v.pct}%`}`).join(', ')}>
              {Object.entries(stats.bands).map(([b, v]) => (!v.hidden && v.pct > 0 ? <span key={b} style={{ width: `${v.pct}%`, background: BAND_COLOUR[b] }} /> : null))}
            </div>
            <ul className={styles.legend}>
              {Object.entries(stats.bands).map(([b, v]) => (
                <li key={b}>
                  <span className={styles.swatch} style={{ background: BAND_COLOUR[b] }} aria-hidden="true" />
                  {labels.bands[b]}
                  <strong>{v.hidden ? t('overview.fewer') : `${v.pct}%`}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="pillars-h">
            <h2 id="pillars-h" className={styles.dayTitle}>
              {t('overview.pillars')}
            </h2>
            <ul className={styles.bars}>
              {PILLARS.map((p) => (
                <li key={p}>
                  <span className={styles.barLabel}>{labels.pillars[p]}</span>
                  <span className={styles.barTrack} aria-hidden="true">
                    <span style={{ width: `${stats.pillars[p] ?? 0}%` }} />
                  </span>
                  <strong className={styles.barValue}>{stats.pillars[p] ?? '–'}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="risks-h">
            <h2 id="risks-h" className={styles.dayTitle}>
              {t('overview.risks')}
            </h2>
            <ul className={styles.riskList}>
              {Object.entries(stats.risks).map(([k, v]) => (
                <li key={k}>
                  <strong className={styles.riskValue}>{v.suppressed ? '–' : v.hidden ? '<5' : `${v.pct}%`}</strong>
                  <span>
                    {labels.risks[k]}
                    <span className={styles.small}>{v.suppressed ? t('overview.notEnough') : t('overview.ofMeasured', { count: v.base })}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="priorities-h">
            <h2 id="priorities-h" className={styles.dayTitle}>
              {t('overview.priorities')}
            </h2>
            <p className={styles.small}>{t('overview.prioritiesHint')}</p>
            <ol className={styles.bars}>
              {stats.priorities.map((p) => (
                <li key={p.id}>
                  <span className={styles.barLabel}>{labels.priorities[p.id]}</span>
                  <span className={styles.barTrack} aria-hidden="true">
                    <span style={{ width: `${p.pct}%`, background: 'var(--ember)' }} />
                  </span>
                  <strong className={styles.barValue}>{p.pct}%</strong>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${styles.panel} ${styles.cta}`}>
            <h2 className={styles.dayTitle}>{t('overview.programmes')}</h2>
            <p className={styles.muted}>{t('overview.programmesBody')}</p>
            <Button to="/partners" size="sm" className={styles.selfStart}>
              {t('overview.programmesCta')}
            </Button>
          </section>
        </div>
      )}
    </div>
  )
}

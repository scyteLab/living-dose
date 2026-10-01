import { useTranslation } from 'react-i18next'
import styles from '@/components/staff/Staff.module.css'
import useStaffData from '@/components/staff/useStaffData'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { listActivity } from '@/lib/staff/api'

export default function StaffActivity() {
  const { t, i18n } = useTranslation('staff')
  useDocumentTitle(t('activity.title'))
  const { data: log } = useStaffData(listActivity)
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('activity.title')}</h1>
      <p className={styles.muted}>{t('activity.intro')}</p>
      {log.length === 0 ? (
        <p className={styles.empty}>{t('activity.empty')}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('activity.cols.when')}</th>
                <th scope="col">{t('activity.cols.who')}</th>
                <th scope="col">{t('activity.cols.action')}</th>
                <th scope="col">{t('activity.cols.detail')}</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e) => (
                <tr key={`${e.at}-${e.detail}`}>
                  <th scope="row">{fmt.format(new Date(e.at))}</th>
                  <td>{e.staff}</td>
                  <td>{t(`activity.actions.${e.action}`, { defaultValue: e.action })}</td>
                  <td>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import DiaryList from '@/components/scan/DiaryList'
import ProductScanner from '@/components/scan/ProductScanner'
import SnapFlow from '@/components/scan/SnapFlow'
import styles from '@/components/scan/Scan.module.css'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useDiary from '@/hooks/useDiary'
import useDocumentTitle from '@/hooks/useDocumentTitle'

/** /scan: log a meal (signed in) or trace a product (anyone). */
export default function Scan() {
  const { t } = useTranslation('scan')
  useDocumentTitle(t('docTitle'))
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'product' ? 'product' : 'meal'

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.intro}>{t('intro')}</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label={t('tabs.label')}>
        {['meal', 'product'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx(styles.tab, tab === id && styles.tabOn)} onClick={() => setParams(id === 'meal' ? {} : { tab: id }, { replace: true })}>
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'product' ? <ProductScanner /> : user ? <MealLogger userId={user.id} /> : <GuestPrompt />}
      </div>
    </div>
  )
}

function MealLogger({ userId }) {
  const diary = useDiary(userId)
  return (
    <div className={styles.layout}>
      <SnapFlow onSave={diary.add} />
      <DiaryList entries={diary.entries} onRemove={diary.remove} />
    </div>
  )
}

function GuestPrompt() {
  const { t } = useTranslation('scan')
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{t('guest.title')}</h2>
      <p className={styles.muted}>{t('guest.body')}</p>
      <Button to="/sign-in" state={{ from: '/scan' }} className={styles.selfStart}>
        {t('guest.cta')}
      </Button>
    </div>
  )
}

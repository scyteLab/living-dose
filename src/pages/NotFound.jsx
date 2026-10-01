import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from '@/components/system/System.module.css'
import Button from '@/components/ui/Button'
import useDocumentTitle from '@/hooks/useDocumentTitle'

const LINKS = ['plan', 'shop', 'care', 'learn', 'community']

export default function NotFound() {
  const { t } = useTranslation()
  useDocumentTitle(t('notFound.title'))
  return (
    <div className={styles.notFound}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.errorTitle}>{t('notFound.title')}</h1>
      <p className={styles.errorBody}>{t('notFound.body')}</p>
      <Button to="/">{t('notFound.cta')}</Button>
      <p className={styles.errorBody}>{t('system.orTry')}</p>
      <ul className={styles.links}>
        {LINKS.map((l) => (
          <li key={l}>
            <Link to={`/${l}`}>{t(`nav.${l}`)}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

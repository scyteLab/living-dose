import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import styles from '@/components/community/Community.module.css'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function GuidelinesPage() {
  const { t } = useTranslation('community')
  useDocumentTitle(t('guidelines.docTitle'))
  return (
    <div className={styles.page}>
      <Link to="/community" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('guidelines.back')}
      </Link>
      <div className={styles.rules}>
        <h1 className={styles.title}>{t('guidelines.title')}</h1>
        <p className={styles.intro}>{t('guidelines.intro')}</p>
        <ol>
          {t('guidelines.items', { returnObjects: true }).map((item) => (
            <li key={item.t}>
              <h2>{item.t}</h2>
              <p>{item.b}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

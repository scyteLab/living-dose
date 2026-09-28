import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/PageHeader'

/** Simple text page (About, Privacy, Contact, Partners). `page` picks the text from pages.* */
export default function StaticPage({ page }) {
  const { t } = useTranslation()

  return <PageHeader title={t(`pages.${page}.title`)} intro={t(`pages.${page}.body`)} />
}

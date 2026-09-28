import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/PageHeader'

export default function Join() {
  const { t } = useTranslation()

  return <PageHeader title={t('auth.joinTitle')} intro={t('auth.joinBody')} />
}

import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Plan() {
  const { t } = useTranslation()

  return <PageHeader title={t('plan.title')} intro={t('plan.empty')} icon={CalendarDays} tone="ember" />
}

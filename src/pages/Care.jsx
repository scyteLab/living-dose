import { useTranslation } from 'react-i18next'
import { HeartPulse } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Care() {
  const { t } = useTranslation()

  return <PageHeader title={t('care.title')} intro={t('care.empty')} icon={HeartPulse} tone="sky" />
}

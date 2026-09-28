import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Community() {
  const { t } = useTranslation()

  return <PageHeader title={t('community.title')} intro={t('community.empty')} icon={Users} tone="plum" />
}

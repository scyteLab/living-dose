import { useTranslation } from 'react-i18next'
import { BookOpen } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Learn() {
  const { t } = useTranslation()

  return <PageHeader title={t('learn.title')} intro={t('learn.empty')} icon={BookOpen} tone="leaf" />
}

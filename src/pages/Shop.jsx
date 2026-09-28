import { useTranslation } from 'react-i18next'
import { ShoppingBag } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Shop() {
  const { t } = useTranslation()

  return <PageHeader title={t('shop.title')} intro={t('shop.empty')} icon={ShoppingBag} tone="leaf" />
}

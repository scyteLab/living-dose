import { useTranslation } from 'react-i18next'
import { ScanLine } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function Scan() {
  const { t } = useTranslation()

  return <PageHeader title={t('scan.title')} intro={t('scan.empty')} icon={ScanLine} tone="ember" />
}

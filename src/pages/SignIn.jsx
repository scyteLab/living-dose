import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/PageHeader'

export default function SignIn() {
  const { t } = useTranslation()

  return <PageHeader title={t('auth.signInTitle')} intro={t('auth.signInBody')} />
}

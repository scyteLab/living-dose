import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', justifyItems: 'start' }}>
      <PageHeader title={t('notFound.title')} intro={t('notFound.body')} />
      <Button to="/" variant="outline">
        {t('notFound.cta')}
      </Button>
    </div>
  )
}

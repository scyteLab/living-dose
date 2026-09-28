import { useTranslation } from 'react-i18next'
import LegalDocument from '@/components/page/LegalDocument'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { site } from '@/config/site'

export default function Terms() {
  const { t } = useTranslation()
  // Company details from config/site.js fill the {{placeholders}} in the text
  const doc = t('terms', { ns: 'legal', returnObjects: true, ...site })
  useDocumentTitle(doc.title)

  return <LegalDocument doc={doc} updated={site.legalUpdated} draftNote={t('legalPage.draftNote')} />
}

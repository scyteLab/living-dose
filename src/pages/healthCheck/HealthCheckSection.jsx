import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HealthCheckLayout from '@/components/healthCheck/HealthCheckLayout'
import AboutSection from '@/components/healthCheck/sections/AboutSection'
import BodySection, { BodyLive } from '@/components/healthCheck/sections/BodySection'
import EatingSection, { EatingLive } from '@/components/healthCheck/sections/EatingSection'
import ActivitySection from '@/components/healthCheck/sections/ActivitySection'
import HabitsSection from '@/components/healthCheck/sections/HabitsSection'
import MindSection, { MindSupport } from '@/components/healthCheck/sections/MindSection'
import HistorySection, { HistoryLive } from '@/components/healthCheck/sections/HistorySection'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useHealthCheck from '@/hooks/useHealthCheck'
import { isBpCrisis } from '@/lib/healthCheck/scoring'
import { SECTION_IDS, firstIncomplete, isSectionComplete } from '@/lib/healthCheck/sections'

const SECTIONS = {
  about: { Form: AboutSection },
  body: { Form: BodySection, Live: BodyLive },
  eating: { Form: EatingSection, Live: EatingLive },
  activity: { Form: ActivitySection },
  habits: { Form: HabitsSection },
  mind: { Form: MindSection, Live: MindSupport },
  history: { Form: HistorySection, Live: HistoryLive },
}

/** One section of the health check at /health-check/:sectionId */
export default function HealthCheckSection() {
  const { sectionId } = useParams()
  const { t } = useTranslation('healthCheck')
  const navigate = useNavigate()
  const { answers, saveNow } = useHealthCheck()
  useDocumentTitle(SECTIONS[sectionId] ? `${t(`sections.${sectionId}.name`)} · ${t('docTitle')}` : t('docTitle'))

  if (!SECTIONS[sectionId]) return <Navigate to="/health-check" replace />

  // Don't let people skip ahead past a section they haven't finished
  const index = SECTION_IDS.indexOf(sectionId)
  const firstOpen = firstIncomplete(answers)
  if (firstOpen && SECTION_IDS.indexOf(firstOpen) < index) return <Navigate to={`/health-check/${firstOpen}`} replace />

  const { Form, Live } = SECTIONS[sectionId]
  const last = index === SECTION_IDS.length - 1

  const goNext = () => {
    saveNow()
    if (!last) return navigate(`/health-check/${SECTION_IDS[index + 1]}`)
    navigate(isBpCrisis(answers.history) ? '/health-check/safety' : '/health-check/calculating')
  }

  const goBack = () => navigate(index === 0 ? '/health-check' : `/health-check/${SECTION_IDS[index - 1]}`)

  return (
    <HealthCheckLayout
      key={sectionId}
      sectionId={sectionId}
      live={Live ? <Live /> : null}
      onBack={goBack}
      onContinue={goNext}
      canContinue={isSectionComplete(sectionId, answers)}
      continueLabel={last ? t('seeResults') : undefined}
    >
      <Form />
    </HealthCheckLayout>
  )
}

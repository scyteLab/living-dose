import { lazy, Suspense } from 'react'
import Hero from '@/components/landing/Hero'
import Pillars from '@/components/landing/Pillars'
import HowItWorks from '@/components/landing/HowItWorks'
import BudgetPlanner from '@/components/landing/BudgetPlanner'
import DiasporaCare from '@/components/landing/DiasporaCare'
import Traceability from '@/components/landing/Traceability'
import ForOrganisations from '@/components/landing/ForOrganisations'
import useAuth from '@/hooks/useAuth'

const Dashboard = lazy(() => import('@/pages/Dashboard'))

/**
 * "/" shows the personal dashboard to signed-in members
 * and the landing page (sections in components/landing) to everyone else.
 */
export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ minHeight: '60vh' }} role="status" aria-label="Loading" />

  if (user) {
    return (
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <Dashboard />
      </Suspense>
    )
  }

  return (
    <>
      <Hero />
      <Pillars />
      <HowItWorks />
      <BudgetPlanner />
      <DiasporaCare />
      <Traceability />
      <ForOrganisations />
    </>
  )
}

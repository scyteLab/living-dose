import Hero from '@/components/landing/Hero'
import Pillars from '@/components/landing/Pillars'
import HowItWorks from '@/components/landing/HowItWorks'
import BudgetPlanner from '@/components/landing/BudgetPlanner'
import DiasporaCare from '@/components/landing/DiasporaCare'
import Traceability from '@/components/landing/Traceability'
import ForOrganisations from '@/components/landing/ForOrganisations'

// The landing page is built from sections in components/landing, in this order.
export default function Home() {
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

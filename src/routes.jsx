/* Route config, not a component file, so the fast-refresh rule doesn't apply here */
/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import AppShell from '@/layouts/AppShell'
import AuthShell from '@/components/auth/AuthShell'
import { GuestOnly, RequireAuth } from '@/components/auth/RequireAuth'
import HealthCheckProvider from '@/providers/HealthCheckProvider'

// Pages load on demand so the first screen stays small and fast on mobile data.
const Home = lazy(() => import('@/pages/Home'))
const Plan = lazy(() => import('@/pages/Plan'))
const Scan = lazy(() => import('@/pages/Scan'))
const Shop = lazy(() => import('@/pages/Shop'))
const Care = lazy(() => import('@/pages/Care'))
const Community = lazy(() => import('@/pages/Community'))
const Learn = lazy(() => import('@/pages/Learn'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const Faq = lazy(() => import('@/pages/Faq'))
const Partners = lazy(() => import('@/pages/Partners'))
const Terms = lazy(() => import('@/pages/Terms'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const SignIn = lazy(() => import('@/pages/auth/SignIn'))
const SignUp = lazy(() => import('@/pages/auth/SignUp'))
const Verify = lazy(() => import('@/pages/auth/Verify'))
const Onboarding = lazy(() => import('@/pages/auth/Onboarding'))
const Welcome = lazy(() => import('@/pages/auth/Welcome'))
const HealthCheckIntro = lazy(() => import('@/pages/healthCheck/HealthCheckIntro'))
const HealthCheckSection = lazy(() => import('@/pages/healthCheck/HealthCheckSection'))
const HealthCheckCalculating = lazy(() => import('@/pages/healthCheck/HealthCheckCalculating'))
const HealthCheckResults = lazy(() => import('@/pages/healthCheck/HealthCheckResults'))
const HealthCheckSafety = lazy(() => import('@/pages/healthCheck/HealthCheckSafety'))

/** Every page in the app. Shared by the real app and the preview build. */
export const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'plan', element: <Plan /> },
      { path: 'scan', element: <Scan /> },
      { path: 'shop', element: <Shop /> },
      { path: 'care', element: <Care /> },
      { path: 'community', element: <Community /> },
      { path: 'learn', element: <Learn /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'faq', element: <Faq /> },
      { path: 'partners', element: <Partners /> },
      { path: 'terms', element: <Terms /> },
      { path: 'privacy', element: <Privacy /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // Sign-in pages: their own full-screen layout, no site navigation
    element: <AuthShell />,
    children: [
      { path: 'sign-in', element: <GuestOnly><SignIn /></GuestOnly> },
      { path: 'join', element: <GuestOnly><SignUp /></GuestOnly> },
      { path: 'verify', element: <Verify /> },
      { path: 'onboarding', element: <RequireAuth><Onboarding /></RequireAuth> },
      { path: 'welcome', element: <RequireAuth><Welcome /></RequireAuth> },
      {
        // Health check: answers are shared across these pages and saved as a draft
        path: 'health-check',
        element: <RequireAuth><HealthCheckProvider /></RequireAuth>,
        children: [
          { index: true, element: <HealthCheckIntro /> },
          { path: 'calculating', element: <HealthCheckCalculating /> },
          { path: 'results', element: <HealthCheckResults /> },
          { path: 'safety', element: <HealthCheckSafety /> },
          { path: ':sectionId', element: <HealthCheckSection /> },
        ],
      },
    ],
  },
]

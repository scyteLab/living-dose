/* Route config: maps each URL to its page */
import AppShell from '@/layouts/AppShell'
import AuthShell from '@/components/auth/AuthShell'
import { GuestOnly, RequireAuth } from '@/components/auth/RequireAuth'
import RouteError from '@/components/errors/RouteError'
import lazyPage from '@/lib/lazyPage'

// Pages load on demand so the first screen stays small and fast on mobile data.
// lazyPage retries once with a reload if a page's file can't be fetched.
const Home = lazyPage(() => import('@/pages/Home'))
const Plan = lazyPage(() => import('@/pages/Plan'))
const Scan = lazyPage(() => import('@/pages/Scan'))
const Shop = lazyPage(() => import('@/pages/Shop'))
const Care = lazyPage(() => import('@/pages/Care'))
const Community = lazyPage(() => import('@/pages/Community'))
const Learn = lazyPage(() => import('@/pages/Learn'))
const About = lazyPage(() => import('@/pages/About'))
const Contact = lazyPage(() => import('@/pages/Contact'))
const Faq = lazyPage(() => import('@/pages/Faq'))
const Partners = lazyPage(() => import('@/pages/Partners'))
const Terms = lazyPage(() => import('@/pages/Terms'))
const Privacy = lazyPage(() => import('@/pages/Privacy'))
const NotFound = lazyPage(() => import('@/pages/NotFound'))
const SignIn = lazyPage(() => import('@/pages/auth/SignIn'))
const SignUp = lazyPage(() => import('@/pages/auth/SignUp'))
const Verify = lazyPage(() => import('@/pages/auth/Verify'))
const Onboarding = lazyPage(() => import('@/pages/auth/Onboarding'))
const Welcome = lazyPage(() => import('@/pages/auth/Welcome'))

/** Every page in the app. Shared by the real app and the preview build. */
export const routes = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
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
    errorElement: <RouteError />,
    children: [
      { path: 'sign-in', element: <GuestOnly><SignIn /></GuestOnly> },
      { path: 'join', element: <GuestOnly><SignUp /></GuestOnly> },
      { path: 'verify', element: <Verify /> },
      { path: 'onboarding', element: <RequireAuth><Onboarding /></RequireAuth> },
      { path: 'welcome', element: <RequireAuth><Welcome /></RequireAuth> },
    ],
  },
]

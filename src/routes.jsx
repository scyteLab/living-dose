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
const Shop = lazy(() => import('@/pages/shop/ShopPage'))
const Product = lazy(() => import('@/pages/shop/ProductPage'))
const Basket = lazy(() => import('@/pages/shop/BasketPage'))
const Checkout = lazy(() => import('@/pages/shop/CheckoutPage'))
const Order = lazy(() => import('@/pages/shop/OrderPage'))
const Orders = lazy(() => import('@/pages/shop/OrdersPage'))
const Care = lazy(() => import('@/pages/care/CarePage'))
const Professional = lazy(() => import('@/pages/care/ProfessionalPage'))
const Appointment = lazy(() => import('@/pages/care/AppointmentPage'))
const Appointments = lazy(() => import('@/pages/care/AppointmentsPage'))
const Community = lazy(() => import('@/pages/community/CommunityPage'))
const CommunityGroup = lazy(() => import('@/pages/community/GroupPage'))
const CommunityPost = lazy(() => import('@/pages/community/PostPage'))
const CommunityGuidelines = lazy(() => import('@/pages/community/GuidelinesPage'))
const Learn = lazy(() => import('@/pages/learn/LearnPage'))
const Article = lazy(() => import('@/pages/learn/ArticlePage'))
const Recipe = lazy(() => import('@/pages/learn/RecipePage'))
const Saved = lazy(() => import('@/pages/learn/SavedPage'))
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
      { path: 'shop/:productId', element: <Product /> },
      { path: 'basket', element: <Basket /> },
      { path: 'checkout', element: <RequireAuth><Checkout /></RequireAuth> },
      { path: 'orders', element: <RequireAuth><Orders /></RequireAuth> },
      { path: 'orders/:orderId', element: <RequireAuth><Order /></RequireAuth> },
      { path: 'care', element: <Care /> },
      { path: 'care/appointments', element: <RequireAuth><Appointments /></RequireAuth> },
      { path: 'care/appointments/:appointmentId', element: <RequireAuth><Appointment /></RequireAuth> },
      { path: 'care/:professionalId', element: <Professional /> },
      { path: 'community', element: <Community /> },
      { path: 'community/guidelines', element: <CommunityGuidelines /> },
      { path: 'community/groups/:groupId', element: <CommunityGroup /> },
      { path: 'community/posts/:postId', element: <CommunityPost /> },
      { path: 'learn', element: <Learn /> },
      { path: 'learn/saved', element: <Saved /> },
      { path: 'learn/recipes/:recipeId', element: <Recipe /> },
      { path: 'learn/:slug', element: <Article /> },
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

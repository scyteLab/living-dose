import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import styles from './AuthLayout.module.css'

/** Only signed-in people see the children; everyone else goes to sign in and comes back after. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className={styles.loading} role="status" aria-label="Loading" />
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return children
}

/** Sign in / sign up pages: people who are already signed in go straight home. */
export function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className={styles.loading} role="status" aria-label="Loading" />
  if (user) return <Navigate to="/" replace />
  return children
}

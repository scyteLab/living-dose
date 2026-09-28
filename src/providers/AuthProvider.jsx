import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { DEMO_AUTH_EVENT, isDemo, readDemoUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/** Keeps track of who is signed in and shares it with the whole app. */
export default function AuthProvider({ children }) {
  const [state, setState] = useState(() =>
    isDemo ? { user: readDemoUser(), loading: false } : { user: null, loading: true },
  )

  useEffect(() => {
    if (isDemo) {
      const onChange = () => setState({ user: readDemoUser(), loading: false })
      window.addEventListener(DEMO_AUTH_EVENT, onChange)
      return () => window.removeEventListener(DEMO_AUTH_EVENT, onChange)
    }

    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      firstName: state.user?.user_metadata?.first_name ?? '',
      signOut,
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { QueryClient } from '@tanstack/react-query'

// One cache for all server data (products, plans, appointments...).
// Tuned for slow or patchy mobile networks.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

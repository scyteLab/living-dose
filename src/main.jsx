import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import RegionProvider from '@/providers/RegionProvider'
import AuthProvider from '@/providers/AuthProvider'
import '@/i18n'
import '@/styles/global.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RegionProvider>
    </QueryClientProvider>
  </StrictMode>,
)

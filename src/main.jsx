import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import RegionProvider from '@/providers/RegionProvider'
import AuthProvider from '@/providers/AuthProvider'
import CartProvider from '@/providers/CartProvider'
import { registerServiceWorker } from '@/lib/pwa'
import '@/i18n'
import '@/styles/global.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </RegionProvider>
    </QueryClientProvider>
  </StrictMode>,
)

registerServiceWorker()

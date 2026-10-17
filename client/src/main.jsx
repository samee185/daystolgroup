import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.jsx'
import { CartProvider } from './lib/cart.jsx'
import './index.css'

// Data refreshes when visitors come back to the tab, so prices and stock stay current.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})

/** Removes the preloader from index.html once the app has rendered for the first time. */
function BootDone() {
  useEffect(() => {
    if (window.__dzBootDone) window.__dzBootDone()
    else document.getElementById('dz-boot')?.remove() // the preloader script didn't run: never leave it covering the page
  }, [])
  return null
}

// The server puts readable page content inside #root for search engines; React replaces it here.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BootDone />
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CartProvider>
    </QueryClientProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { LoginModalProvider } from './components/LoginModal'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setClerkTokenGetter } from './lib/api-client'

function AuthInit({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()
  useEffect(() => {
    setClerkTokenGetter(() => getToken())
  }, [getToken])
  return <>{children}</>
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthInit>
        <LoginModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LoginModalProvider>
      </AuthInit>
    </ClerkProvider>
  </StrictMode>,
)

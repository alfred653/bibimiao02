import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { LoginModalProvider } from './components/LoginModal'
import { ToastProvider } from './components/Toast'
import { useThemeSource, ThemeProvider } from './hooks/useTheme'
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

function ThemeInit({ children }: { children: React.ReactNode }) {
  const themeSource = useThemeSource()
  return <ThemeProvider source={themeSource}>{children}</ThemeProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthInit>
        <ThemeInit>
          <LoginModalProvider>
            <ToastProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ToastProvider>
          </LoginModalProvider>
        </ThemeInit>
      </AuthInit>
    </ClerkProvider>
  </StrictMode>,
)

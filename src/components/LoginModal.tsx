import { createContext, useContext, useState, type ReactNode } from 'react'
import { SignIn } from '@clerk/clerk-react'

interface Ctx {
  open: boolean
  openLogin: () => void
  closeLogin: () => void
}
const LoginModalCtx = createContext<Ctx>({ open: false, openLogin: () => {}, closeLogin: () => {} })

export function useLoginModal() { return useContext(LoginModalCtx) }

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <LoginModalCtx.Provider value={{ open, openLogin: () => setOpen(true), closeLogin: () => setOpen(false) }}>
      {children}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--overlay)', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '24px', width: '100%', maxWidth: '448px', position: 'relative' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close"
            >&#10005;</button>
            <SignIn />
          </div>
        </div>
      )}
    </LoginModalCtx.Provider>
  )
}

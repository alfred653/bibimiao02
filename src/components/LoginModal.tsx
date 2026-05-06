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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-md">
            <button className="text-gray-400 float-right text-xl p-1 min-w-[36px] min-h-[36px] hover:text-white active:text-white transition-colors flex items-center justify-center rounded-lg" onClick={() => setOpen(false)}>✕</button>
            <SignIn />
          </div>
        </div>
      )}
    </LoginModalCtx.Provider>
  )
}

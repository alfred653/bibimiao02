import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  leaving: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type, leaving: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300)
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-xl text-sm shadow-lg pointer-events-auto transition-all duration-300 ${
              t.leaving ? 'opacity-0 translate-y-2' : 'opacity-100'
            } ${
              t.type === 'success' ? 'bg-[var(--success)] text-white' :
              t.type === 'error' ? 'bg-[var(--danger)] text-white' :
              'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            {t.type === 'success' && '✓ '}
            {t.type === 'error' && '✕ '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

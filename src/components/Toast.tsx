import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast { id: number; message: string; type: ToastType; leaving: boolean }

interface ToastContextValue { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type, leaving: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)) }, 200)
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px + env(safe-area-inset-bottom))', left: 0, right: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '8px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            pointerEvents: 'auto',
            border: 'var(--border-width) solid var(--border-default)',
            background: t.type === 'success' ? 'var(--bg-active)' : t.type === 'error' ? 'var(--danger)' : 'var(--bg-primary)',
            color: t.type === 'info' ? 'var(--text-primary)' : 'var(--text-inverse)',
            opacity: t.leaving ? 0 : 1,
            transform: t.leaving ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 200ms linear, transform 200ms linear',
          }}>
            {t.type === 'success' && '✓ '}
            {t.type === 'error' && '✕ '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

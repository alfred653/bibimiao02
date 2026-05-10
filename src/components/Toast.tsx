import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast { id: number; message: string; type: ToastType; leaving: boolean; action?: { label: string; onClick: () => void } }

interface ToastContextValue { toast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info', action?: { label: string; onClick: () => void }) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type, leaving: false, action }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)) }, 200)
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px + env(safe-area-inset-bottom))', left: 0, right: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '8px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px',
            border: 'var(--border-width) solid var(--border-default)',
            background: t.type === 'success' ? 'var(--bg-active)' : t.type === 'error' ? 'var(--danger)' : 'var(--bg-primary)',
            color: t.type === 'info' ? 'var(--text-primary)' : 'var(--text-inverse)',
            opacity: t.leaving ? 0 : 1,
            transform: t.leaving ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 200ms linear, transform 200ms linear',
          }}>
            <span>{t.type === 'success' && '✓ '}{t.type === 'error' && '✕ '}{t.message}</span>
            {t.action && (
              <button onClick={t.action.onClick} style={{
                background: 'transparent', border: '1px solid currentColor', padding: '2px 8px',
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                color: 'inherit', whiteSpace: 'nowrap',
              }}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

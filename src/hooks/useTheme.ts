import { useState, useEffect, useCallback, createContext, useContext, createElement } from 'react'

export type ThemeChoice = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

const STORAGE_KEY = 'bibimiao-theme'

function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return choice
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved)
  const mc = document.querySelector('meta[name="theme-color"]')
  if (mc) mc.setAttribute('content', resolved === 'light' ? '#F7F1EA' : '#171512')
}

export function useThemeSource() {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || 'system'
  })
  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || 'system'
    return resolveTheme(stored)
  })

  const setTheme = useCallback((c: ThemeChoice) => {
    setChoiceState(c)
    localStorage.setItem(STORAGE_KEY, c)
    const r = resolveTheme(c)
    setResolved(r)
    applyTheme(r)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice || 'system'
      if (stored === 'system') {
        const r = resolveTheme('system')
        setResolved(r)
        applyTheme(r)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { choice, resolved, setTheme }
}

interface ThemeContextValue {
  choice: ThemeChoice
  resolved: ResolvedTheme
  setTheme: (c: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  choice: 'system',
  resolved: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children, source }: { children: React.ReactNode; source: ThemeContextValue }) {
  return createElement(ThemeContext.Provider, { value: source }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}

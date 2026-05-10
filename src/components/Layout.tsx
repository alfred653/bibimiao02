import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const tabs = [
  { to: '/', label: '品牌' },
  { to: '/search', label: '搜索' },
  { to: '/favorites', label: '收藏' },
  { to: '/profile', label: '我的' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <main className="flex-1 overflow-auto" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--bg-nav)',
          color: 'var(--text-inverse)',
        }}
      >
        {tabs.map(({ to, label }, i) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center justify-center no-underline"
            style={({ isActive }: { isActive: boolean }) => ({
              fontSize: 'var(--fs-label)',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: isActive ? 'var(--text-inverse)' : 'var(--nav-inactive)',
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              borderLeft: i > 0 ? '1px solid var(--nav-separator)' : 'none',
              minHeight: 'var(--bottom-nav-height)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

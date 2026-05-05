import { Outlet, NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/search', label: '搜索', icon: '🔍' },
  { to: '/favorites', label: '收藏', icon: '❤️' },
  { to: '/profile', label: '我的', icon: '👤' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#121921] text-white flex flex-col">
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#0d141c] border-t border-white/10 flex items-center justify-around z-40">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`
            }
          >
            <span className="text-lg">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

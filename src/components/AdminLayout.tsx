import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'

const links = [
  { to: '/admin', label: '仪表板', end: true },
  { to: '/admin/users', label: '用户管理' },
  { to: '/admin/products', label: '商品管理' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#121921] text-white flex">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded bg-[#0d141c] border border-white/10"
        aria-label="打开菜单"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-48 bg-[#0d141c] border-r border-white/10 p-4 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">管理后台</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-2 mb-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/5'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <hr className="border-white/10 mb-4" />
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded text-gray-400 hover:bg-white/5 text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 7H1M1 7l5-5M1 7l5 5" />
          </svg>
          返回主应用
        </Link>
      </aside>

      <main className="flex-1 p-6 overflow-auto pt-14 md:pt-6">
        <Outlet />
      </main>
    </div>
  )
}

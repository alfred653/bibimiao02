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
    <div className="min-h-screen bg-[#141413] text-[#faf9f5] flex">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded bg-[#0D0D0C] border border-white/[0.08]"
        aria-label="打开菜单"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-48 bg-[#0D0D0C] border-r border-white/[0.06] p-4 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">管理后台</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#b0aea5] hover:text-[#faf9f5]">
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
                `px-3 py-2 rounded ${isActive ? 'bg-[#d97757] text-white' : 'text-[#b0aea5] hover:bg-white/[0.04]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <hr className="border-white/[0.06] mb-4" />
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded text-[#b0aea5] hover:bg-white/[0.04] text-sm"
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

import { Outlet, NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: '仪表板', end: true },
  { to: '/admin/users', label: '用户管理' },
  { to: '/admin/products', label: '商品管理' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#121921] text-white flex">
      <aside className="w-48 bg-[#0d141c] border-r border-white/10 p-4 hidden md:block">
        <h2 className="text-lg font-bold mb-4">管理后台</h2>
        <nav className="flex flex-col gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/5'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

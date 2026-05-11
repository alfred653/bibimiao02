import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'

const links = [
  { to: '/admin', label: '管理后台', end: true },
  { to: '/admin/users', label: '用户', end: false },
  { to: '/admin/products', label: '商品', end: false },
  { to: '/admin/carriers', label: '承运商', end: false },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--admin-bg-page)', color: 'var(--text-primary)', display: 'flex' }}>
      {/* Admin mode banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        height: '28px', background: 'var(--admin-bg-sidebar)',
        borderBottom: 'var(--border-width) solid var(--admin-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-inverse)', opacity: 0.7 }}>管理模式</span>
        <Link to="/" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-inverse)', opacity: 0.45, textDecoration: 'none' }}>← 返回应用</Link>
      </div>

      <button
        onClick={() => setSidebarOpen(true)}
        style={{ position: 'fixed', top: '40px', left: '12px', zIndex: 30, padding: '8px', background: 'var(--admin-bg-sidebar)', border: 'var(--border-width) solid var(--admin-border)', cursor: 'pointer', color: 'var(--text-inverse)' }}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--overlay)' }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
        width: '192px', background: 'var(--admin-bg-sidebar)',
        borderRight: 'var(--border-width) solid var(--admin-border)',
        padding: '16px',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 150ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--text-inverse)', margin: 0 }}>Admin</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-inverse)', opacity: 0.7, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                padding: '8px 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none',
                background: isActive ? 'var(--brand)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-inverse)',
                opacity: isActive ? 1 : 0.65,
                border: isActive ? 'none' : 'var(--border-width) solid transparent',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <hr style={{ border: 'none', borderTop: 'var(--border-width) solid var(--admin-border)', marginBottom: '16px' }} />
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', textDecoration: 'none', color: 'var(--text-inverse)', opacity: 0.65, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 7H1M1 7l5-5M1 7l5 5" />
          </svg>
          Back to App
        </Link>
      </aside>

      <main style={{ flex: 1, padding: '24px', overflow: 'auto', paddingTop: '72px', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}

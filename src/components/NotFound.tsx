import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col items-center justify-center p-8">
      <div className="text-6xl mb-4 text-[var(--text-secondary)]">404</div>
      <h1 className="text-xl font-bold mb-2">页面不存在</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">你访问的页面可能已被移除或地址有误</p>
      <Link
        to="/"
        className="bg-[var(--brand)] text-white px-6 py-2 rounded-lg text-sm hover:bg-[var(--brand-hover)] active:bg-[var(--brand-soft)] transition-colors"
      >
        返回首页
      </Link>
    </div>
  )
}

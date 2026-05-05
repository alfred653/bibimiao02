import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121921] text-white flex flex-col items-center justify-center p-8">
      <div className="text-6xl mb-4 text-gray-600">404</div>
      <h1 className="text-xl font-bold mb-2">页面不存在</h1>
      <p className="text-gray-400 text-sm mb-6">你访问的页面可能已被移除或地址有误</p>
      <Link
        to="/"
        className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-cyan-500 transition-colors"
      >
        返回首页
      </Link>
    </div>
  )
}

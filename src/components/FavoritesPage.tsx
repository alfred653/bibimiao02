import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { api, apiDelete } from '../lib/api-client'

export default function FavoritesPage() {
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()
  const nav = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  function loadFavorites() {
    api('/api/favorites')
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.data.items) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); setLoading(false); return }
    loadFavorites()
  }, [isSignedIn])

  function removeFavorite(productId: number) {
    apiDelete('/api/favorites', { productId })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(prev => prev.filter(it => it.id !== productId)) })
  }

  if (!isSignedIn) return <div className="p-8 text-center text-gray-400">请先登录</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">我的收藏</h1>
      {loading ? <div className="text-gray-400 text-center">加载中...</div> :
       !items.length ? <div className="text-gray-400 text-center py-8">暂无收藏</div> :
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 flex gap-3" onClick={() => nav(`/product/${item.id}`)}>
              <img
                src={item.imageUrl || `https://placehold.co/112x112/1a2332/06b6d4?text=${encodeURIComponent((item.brand || '').slice(0, 8))}`}
                alt=""
                className="w-14 h-14 rounded-lg object-cover bg-white/5 shrink-0"
                onError={e => {
                  const el = e.target as HTMLImageElement
                  el.src = `https://placehold.co/112x112/1a2332/666?text=N%2FA`
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm">{item.title}</h3>
                <div className="flex gap-2 mt-1 text-xs text-gray-400">
                  <span className="text-cyan-400">{item.brand}</span>
                  {item.price && <span>{item.currency} ${item.price}</span>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFavorite(item.id) }}
                className="shrink-0 text-gray-600 hover:text-red-400 text-lg px-1 transition-colors"
                title="取消收藏"
              >×</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

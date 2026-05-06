import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiDelete } from '../lib/api-client'

export default function FavoritesPage() {
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()
  const nav = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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
      .then(d => {
        if (d.success) { setItems(prev => prev.filter(it => it.id !== productId)); toast('已取消收藏', 'success') }
        else toast(d.error?.message || '操作失败', 'error')
      })
      .catch(() => toast('网络错误', 'error'))
  }

  if (!isSignedIn) return <div className="p-8 text-center text-[#8b8a7e]">请先登录</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">我的收藏</h1>
      {loading ? <div className="text-[#8b8a7e] text-center">加载中...</div> :
       !items.length ? <div className="text-[#8b8a7e] text-center py-8">暂无收藏</div> :
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white/[0.04] rounded-xl p-3 cursor-pointer hover:bg-white/[0.06] active:bg-white/[0.08] flex gap-3 transition-colors" onClick={() => nav(`/product/${item.id}`)}>
              <img
                src={item.imageUrl || `https://placehold.co/112x112/1a1a17/d97706?text=${encodeURIComponent((item.brand || '').slice(0, 8))}`}
                alt=""
                className="w-14 h-14 rounded-lg object-cover bg-white/[0.04] shrink-0"
                onError={e => {
                  const el = e.target as HTMLImageElement
                  el.src = `https://placehold.co/112x112/1a1a17/666?text=N%2FA`
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm truncate">{item.title}</h3>
                <div className="flex gap-2 mt-1 text-xs text-[#8b8a7e]">
                  <span className="text-amber-400">{item.brand}</span>
                  {item.price && <span>{item.currency} {item.price}</span>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFavorite(item.id) }}
                className="shrink-0 text-[#8b8a7e] hover:text-red-400 active:bg-red-600/10 text-lg min-w-[36px] min-h-[36px] transition-colors rounded-lg flex items-center justify-center"
                title="取消收藏"
              >×</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

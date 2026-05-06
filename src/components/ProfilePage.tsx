import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { api } from '../lib/api-client'

export default function ProfilePage() {
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const { openLogin } = useLoginModal()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (!isSignedIn) { openLogin(); return }
    api('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data) })
  }, [isSignedIn])

  if (!isSignedIn) return <div className="p-8 text-center text-[#b0aea5]">请先登录</div>

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <img src={user?.imageUrl || ''} alt="" className="w-16 h-16 rounded-full mx-auto mb-2" />
        <h1 className="text-lg font-bold">{user?.fullName || profile?.name || '用户'}</h1>
        <p className="text-xs text-[#b0aea5]">{profile?.email}</p>
        {profile && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${profile.membershipTier === 'free' ? 'bg-[#b0aea5]/20 text-[#b0aea5]' : 'bg-[#d97757]/10 text-[#d97757]'}`}>
            {profile.membershipTier === 'free' ? '免费用户' : profile.membershipTier === 'lifetime' ? '终身会员' : '付费会员'}
          </span>
        )}
      </div>

      {profile?.configuredBrands?.length > 0 && (
        <div className="bg-white/[0.04] rounded-xl p-4 mb-4">
          <div className="text-xs text-[#b0aea5] mb-2">配置品牌</div>
          <div className="flex flex-wrap gap-1">
            {profile.configuredBrands.map((b: string) => (
              <span key={b} className="bg-[#d97757]/10 text-[#d97757] text-xs px-2 py-0.5 rounded">{b}</span>
            ))}
          </div>
        </div>
      )}

      {profile?.role === 'admin' && (
        <button onClick={() => navigate('/admin')} className="w-full bg-[#d97757]/10 text-[#d97757] py-3 rounded-xl text-sm active:bg-[#d97757]/20 transition-colors">
          管理后台
        </button>
      )}

      <button onClick={() => signOut()} className="w-full bg-[#b53333]/10 text-[#b53333] py-3 rounded-xl text-sm mt-4 active:bg-[#b53333]/20 transition-colors">
        退出登录
      </button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiPut } from '../lib/api-client'

function NameEditModal({ currentName, onClose, onSaved }: { currentName: string; onClose: () => void; onSaved: () => void }) {
  const { user } = useUser()
  const { toast } = useToast()
  const [username, setUsername] = useState(currentName || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    const v = username.trim()
    if (!v) { toast('用户名不能为空', 'error'); return }
    setSaving(true)
    try {
      await user!.update({ username: v })
      await apiPut('/api/profile', { name: v })
      toast('用户名已更新', 'success')
      onSaved()
    } catch (e: any) {
      toast(e.errors?.[0]?.message || e.message || '更新失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1C1C1A] rounded-xl p-6 w-full max-w-sm border border-white/[0.06]">
        <h3 className="text-lg font-bold mb-4">修改用户名</h3>
        <div>
          <label className="text-[#b0aea5] text-xs block mb-1">用户名</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="输入用户名"
            className="w-full bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]" />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-white/[0.04] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#d97757] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[#c45e3e] transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!currentPassword) { toast('请输入当前密码', 'error'); return }
    if (newPassword.length < 8) { toast('新密码至少 8 位', 'error'); return }
    if (newPassword !== confirmPassword) { toast('两次输入的新密码不一致', 'error'); return }
    setSaving(true)
    try {
      await user!.updatePassword({ currentPassword, newPassword, signOutOfOtherSessions: false })
      toast('密码已更新', 'success')
      onClose()
    } catch (e: any) {
      const msg = e.errors?.[0]?.message || e.message || '修改失败'
      toast(msg === 'Incorrect password' ? '当前密码错误' : msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1C1C1A] rounded-xl p-6 w-full max-w-sm border border-white/[0.06]">
        <h3 className="text-lg font-bold mb-4">修改密码</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[#b0aea5] text-xs block mb-1">当前密码</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="输入当前密码"
              className="w-full bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]" />
          </div>
          <div>
            <label className="text-[#b0aea5] text-xs block mb-1">新密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少 8 位"
              className="w-full bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]" />
          </div>
          <div>
            <label className="text-[#b0aea5] text-xs block mb-1">确认新密码</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="再次输入新密码"
              className="w-full bg-[#1C1C1A] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#faf9f5] placeholder-[#b0aea5]" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-white/[0.04] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#d97757] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[#c45e3e] transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const { openLogin } = useLoginModal()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)

  const fetchProfile = () => {
    api('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data) })
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); return }
    fetchProfile()
  }, [isSignedIn])

  if (!isSignedIn) return <div className="p-8 text-center text-[#b0aea5]">请先登录</div>

  const displayName = user?.fullName || profile?.name || '用户'

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <img src={user?.imageUrl || ''} alt="" className="w-16 h-16 rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-lg font-bold">{displayName}</h1>
          <button
            onClick={() => setShowNameModal(true)}
            className="p-0.5 rounded text-[#b0aea5] hover:text-[#faf9f5] active:text-[#faf9f5]"
            aria-label="修改用户名"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#b0aea5]">{profile?.email}</p>
        {profile && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${profile.membershipTier === 'free' ? 'bg-[#b0aea5]/20 text-[#b0aea5]' : 'bg-[#d97757]/10 text-[#d97757]'}`}>
            {profile.membershipTier === 'free' ? '免费用户' : profile.membershipTier === 'lifetime' ? '终身会员' : '付费会员'}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={() => setShowNameModal(true)}
          className="w-full bg-white/[0.04] rounded-xl p-4 text-left flex items-center justify-between hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
        >
          <div>
            <div className="text-sm">用户名</div>
            <div className="text-xs text-[#b0aea5] mt-0.5">{displayName}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#b0aea5]">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>

        <button
          onClick={() => setShowPwdModal(true)}
          className="w-full bg-white/[0.04] rounded-xl p-4 text-left flex items-center justify-between hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
        >
          <div>
            <div className="text-sm">密码</div>
            <div className="text-xs text-[#b0aea5] mt-0.5">修改登录密码</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#b0aea5]">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
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
        <button onClick={() => navigate('/admin')} className="w-full bg-[#d97757]/10 text-[#d97757] py-3 rounded-xl text-sm active:bg-[#d97757]/20 transition-colors mb-4">
          管理后台
        </button>
      )}

      <button onClick={() => signOut()} className="w-full bg-[#b53333]/10 text-[#b53333] py-3 rounded-xl text-sm active:bg-[#b53333]/20 transition-colors">
        退出登录
      </button>

      {showNameModal && (
        <NameEditModal
          currentName={displayName}
          onClose={() => setShowNameModal(false)}
          onSaved={() => { setShowNameModal(false); fetchProfile(); user?.reload() }}
        />
      )}
      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} />}
    </div>
  )
}

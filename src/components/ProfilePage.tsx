import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { useTheme, type ThemeChoice } from '../hooks/useTheme'
import { api, apiPut } from '../lib/api-client'

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 3) return `${local[0]}***@${domain}`
  return `${local.slice(0, 4)}***@${domain}`
}

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
      await user!.update({ firstName: v, lastName: '' })
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
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-bold mb-4">修改用户名</h3>
        <div>
          <label className="text-[var(--text-secondary)] text-xs block mb-1">用户名</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="输入用户名"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-card)] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
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
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-bold mb-4">修改密码</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">当前密码</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="输入当前密码"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">新密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少 8 位"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">确认新密码</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="再次输入新密码"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-card)] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

const THEME_OPTIONS: { value: ThemeChoice; label: string; desc: string }[] = [
  { value: 'system', label: '跟随系统', desc: '自动匹配系统外观' },
  { value: 'dark', label: '暖暗色', desc: '深色背景，适合夜间使用' },
  { value: 'light', label: '暖浅色', desc: '浅色背景，适合白天浏览' },
]

function ThemeModal({ current, onClose }: { current: ThemeChoice; onClose: () => void }) {
  const { setTheme } = useTheme()
  const [selected, setSelected] = useState<ThemeChoice>(current)

  function apply() {
    setTheme(selected)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>主题外观</h3>
        <div className="space-y-2">
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className="w-full text-left p-3 rounded-lg border transition-colors"
              style={{
                background: selected === opt.value ? 'var(--brand-soft)' : 'var(--bg-input)',
                borderColor: selected === opt.value ? 'var(--brand)' : 'var(--border-subtle)',
              }}
            >
              <div style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{opt.label}</div>
              <div style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-body)' }}>取消</button>
          <button onClick={apply} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
            style={{ background: 'var(--brand)', color: 'var(--button-on-brand)' }}>
            应用
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
  const [showThemeModal, setShowThemeModal] = useState(false)
  const { choice, resolved } = useTheme()
  const { toast } = useToast()

  const fetchProfile = () => {
    api('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data) })
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); return }
    fetchProfile()
  }, [isSignedIn])

  if (!isSignedIn) return <div className="p-8 text-center text-[var(--text-secondary)]">请先登录</div>

  const displayName = user?.fullName || profile?.name || '用户'

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <img src={user?.imageUrl || ''} alt="" className="w-16 h-16 rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-lg font-bold">{displayName}</h1>
          <button
            onClick={() => setShowNameModal(true)}
            className="p-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:text-[var(--text-primary)]"
            aria-label="修改用户名"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">{profile?.email ? maskEmail(profile.email) : ''}</p>
        {profile && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${profile.membershipTier === 'free' ? 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>
            {profile.membershipTier === 'free' ? '免费用户' : profile.membershipTier === 'lifetime' ? '终身会员' : '付费会员'}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={() => setShowNameModal(true)}
          className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
        >
          <div>
            <div className="text-sm">用户名</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{displayName}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>

        <button
          onClick={() => setShowPwdModal(true)}
          className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
        >
          <div>
            <div className="text-sm">密码</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">修改登录密码</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>

        <button
          onClick={() => setShowThemeModal(true)}
          className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
        >
          <div>
            <div className="text-sm">主题外观</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{THEME_OPTIONS.find(o => o.value === choice)?.label} · {resolved === 'dark' ? '暖暗色' : '暖浅色'}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 mb-4">
          <button
            onClick={() => navigate('/recent-views')}
            className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
          >
            <div>
              <div className="text-sm">最近浏览</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">查看最近浏览过的商品</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]"><path d="M6 4l4 4-4 4"/></svg>
          </button>
          <button
            onClick={() => navigate('/default-shipping')}
            className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
          >
            <div>
              <div className="text-sm">默认物流设置</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">设置默认快递模板和运费参数</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]"><path d="M6 4l4 4-4 4"/></svg>
          </button>
          <button
            onClick={() => toast('功能开发中', 'info')}
            className="w-full bg-[var(--bg-card)] rounded-xl p-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
          >
            <div>
              <div className="text-sm">汇率设置</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">设置默认汇率来源和偏好币种</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-secondary)]"><path d="M6 4l4 4-4 4"/></svg>
          </button>
        </div>

	      {profile?.configuredBrands?.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4">
          <div className="text-xs text-[var(--text-secondary)] mb-2">配置品牌</div>
          <div className="flex flex-wrap gap-1">
            {profile.configuredBrands.map((b: string) => (
              <span key={b} className="bg-[var(--brand-soft)] text-[var(--brand)] text-xs px-2 py-0.5 rounded">{b}</span>
            ))}
          </div>
        </div>
      )}

      {profile?.role === 'admin' && (
        <button onClick={() => navigate('/admin')} className="w-full bg-[var(--brand-soft)] text-[var(--brand)] py-3 rounded-xl text-sm active:bg-[var(--brand-soft)] transition-colors mb-4">
          管理后台
        </button>
      )}

      <button onClick={() => signOut()} className="w-full bg-[var(--danger)]/10 text-[var(--danger)] py-3 rounded-xl text-sm active:bg-[var(--danger)]/20 transition-colors">
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
      {showThemeModal && <ThemeModal current={choice} onClose={() => setShowThemeModal(false)} />}
    </div>
  )
}

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

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--overlay)', padding: '16px',
}
const modalBox: React.CSSProperties = {
  background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
  padding: '24px', width: '100%', maxWidth: '360px',
}

function NameEditModal({ currentName, onClose, onSaved }: { currentName: string; onClose: () => void; onSaved: () => void }) {
  const { user } = useUser()
  const { toast } = useToast()
  const [username, setUsername] = useState(currentName || '')
  const [saving, setSaving] = useState(false)
  async function save() {
    const v = username.trim()
    if (!v) { toast('名称不能为空', 'error'); return }
    setSaving(true)
    try {
      await user!.update({ firstName: v, lastName: '' })
      await apiPut('/api/profile', { name: v })
      toast('名称已更新', 'success'); onSaved()
    } catch (e: any) { toast(e.errors?.[0]?.message || e.message || '更新失败', 'error') }
    finally { setSaving(false) }
  }
  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalBox}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>编辑用户名</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>用户名</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="你的名字"
            style={{ width: '100%', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', outline: 'none' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>取消</button>
          <button onClick={save} disabled={saving} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.4 : 1 }}>{saving ? '保存中...' : '保存'}</button>
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
    if (newPassword.length < 8) { toast('至少8位字符', 'error'); return }
    if (newPassword !== confirmPassword) { toast('两次密码不一致', 'error'); return }
    setSaving(true)
    try {
      await user!.updatePassword({ currentPassword, newPassword, signOutOfOtherSessions: false })
      toast('密码已更新', 'success'); onClose()
    } catch (e: any) {
      const msg = e.errors?.[0]?.message || e.message || 'Failed'
      toast(msg === 'Incorrect password' ? '密码错误' : msg, 'error')
    } finally { setSaving(false) }
  }
  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalBox}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>修改密码</h3>
        {[
          ['当前密码', currentPassword, setCurrentPassword, 'password'],
          ['新密码', newPassword, setNewPassword, 'password'],
          ['确认密码', confirmPassword, setConfirmPassword, 'password'],
        ].map(([label, val, setFn, type], i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{label as string}</label>
            <input type={type as string} value={val as string} onChange={e => (setFn as any)(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>取消</button>
          <button onClick={save} disabled={saving} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.4 : 1 }}>{saving ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  )
}

const THEME_OPTIONS: { value: ThemeChoice; label: string; desc: string }[] = [
  { value: 'system', label: '系统', desc: '跟随系统设置' },
  { value: 'light', label: '暖色', desc: '琥珀暖色模式' },
  { value: 'dark', label: '工业风', desc: '灰绿档案风格' },
]

function ThemeModal({ current, onClose }: { current: ThemeChoice; onClose: () => void }) {
  const { setTheme } = useTheme()
  const [selected, setSelected] = useState<ThemeChoice>(current)
  function apply() { setTheme(selected); onClose() }
  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalBox}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>外观主题</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {THEME_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px', cursor: 'pointer', border: 'var(--border-width) solid',
                background: selected === opt.value ? 'var(--bg-active)' : 'var(--bg-primary)',
                color: selected === opt.value ? 'var(--text-inverse)' : 'var(--text-primary)',
                borderColor: selected === opt.value ? 'var(--bg-active)' : 'var(--border-default)',
              }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>{opt.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>取消</button>
          <button onClick={apply} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>应用</button>
        </div>
      </div>
    </div>
  )
}

const TIER_BENEFITS = [
  { tier: 'free', name: '免费会员', price: '免费', features: ['搜索与浏览', '查看实时价格', '10 个收藏', '每日 5 次成本估算', '浏览历史', '主题切换', '默认物流设置', '汇率偏好'] },
  { tier: 'monthly', name: '月付会员', price: '月付', features: ['所有免费功能', '无限收藏', '无限成本估算', '实时汇率', '3 个品牌完整数据'] },
  { tier: 'annual', name: '年付会员', price: '年付', features: ['所有月付功能', '全部品牌数据', '优先支持', '新品提醒', '年付折扣'] },
]

function MembershipModal({ currentTier, onClose }: { currentTier: string; onClose: () => void }) {
  const currentTierInfo = TIER_BENEFITS.find(t => t.tier === currentTier)
  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalBox, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 4px' }}>会员等级</h3>
        <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
          当前: <span style={{ color: 'var(--brand)' }}>{currentTierInfo?.name || currentTier}</span>
        </p>
        {TIER_BENEFITS.map(tier => (
          <div key={tier.tier} style={{
            border: 'var(--border-width) solid', background: 'var(--bg-primary)',
            borderColor: currentTier === tier.tier ? 'var(--brand)' : 'var(--border-default)',
            padding: '12px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{tier.name}</span>
              <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>{tier.price}</span>
            </div>
            {tier.features.map((f, i) => (
              <div key={i} style={{ fontSize: '13px', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--success)', fontSize: '10px' }}>✓</span> {f}
              </div>
            ))}
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', marginTop: '8px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>关闭</button>
      </div>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
  padding: '12px', textAlign: 'left', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '-1px',
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
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const { choice } = useTheme()

  const fetchProfile = () => {
    api('/api/profile').then(r => r.json()).then(d => { if (d.success) setProfile(d.data) })
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); return }
    fetchProfile()
  }, [isSignedIn])

  if (!isSignedIn) return <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>请先登录</div>

  const displayName = user?.fullName || profile?.name || 'User'

  return (
    <div style={{ padding: 'var(--page-padding)', paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '13px', fontWeight: 800 }}>04</span>
      </header>

      {/* Profile header */}
      <div style={{ padding: '16px 0', textAlign: 'center', borderBottom: 'var(--border-width) solid var(--border-default)', marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '999px', background: 'var(--bg-active)', color: 'var(--text-inverse)', display: 'grid', placeItems: 'center', margin: '0 auto 8px', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900 }}>{displayName.charAt(0)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>{displayName}</h1>
          <button onClick={() => setShowNameModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} aria-label="Edit name">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" /></svg>
          </button>
        </div>
        <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginTop: '4px' }}>{profile?.email ? maskEmail(profile.email) : ''}</p>
        {profile && (() => {
          const tier = TIER_BENEFITS.find(t => t.tier === profile.membershipTier)
          const name = tier?.name || profile.membershipTier || 'FREE'
          const isAdmin = profile.role === 'admin'
          return (
            <button onClick={() => setShowMembershipModal(true)} style={{
              marginTop: '6px', padding: '3px 10px', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              background: isAdmin ? 'var(--admin-badge)' : 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none',
            }}>
              {name}{isAdmin ? ' · ADMIN' : ''}
            </button>
          )
        })()}
      </div>

      {/* Settings list */}
      <div style={{ marginTop: '12px' }}>
        {[
          ['用户名', displayName, () => setShowNameModal(true)],
          ['密码', '修改登录密码', () => setShowPwdModal(true)],
          ['外观主题', `${THEME_OPTIONS.find(o => o.value === choice)?.label}`, () => setShowThemeModal(true)],
        ].map(([label, value, onClick], i) => (
          <button key={i} onClick={onClick as any} style={rowStyle}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{label as string}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginTop: '2px' }}>{value as string}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
          </button>
        ))}
      </div>

      <div style={{ marginTop: '12px' }}>
        {[
          ['最近浏览', '查看浏览记录', () => navigate('/recent-views')],
          ['默认运费', '承运商与重量预设', () => navigate('/default-shipping')],
          ['汇率设置', '默认显示币种', () => navigate('/exchange-rate')],
        ].map(([label, desc, onClick], i) => (
          <button key={i} onClick={onClick as any} style={rowStyle}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{label as string}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginTop: '2px' }}>{desc as string}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
          </button>
        ))}
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0 6px' }}>法律信息</div>
        {[
          ['隐私政策', '个人信息收集与使用', () => navigate('/privacy')],
          ['服务协议', '用户条款与条件', () => navigate('/terms')],
          ['免责声明', '价格与信息准确性', () => navigate('/disclaimer')],
        ].map(([label, desc, onClick], i) => (
          <button key={i} onClick={onClick as any} style={rowStyle}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{label as string}</div>
              <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginTop: '2px' }}>{desc as string}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
          </button>
        ))}
      </div>

      {profile?.configuredBrands?.length > 0 && (
        <div style={{ marginTop: '12px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '12px' }}>
          <div style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>已配置品牌</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {profile.configuredBrands.map((b: string) => (
              <span key={b} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px' }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      {profile?.role === 'admin' && (
        <button onClick={() => navigate('/admin')} style={{ width: '100%', marginTop: '12px', background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '12px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
          进入管理后台
        </button>
      )}

      <button onClick={() => signOut()} style={{ width: '100%', marginTop: '12px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--danger)', color: 'var(--danger)', padding: '12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
        退出登录
      </button>

      {showNameModal && <NameEditModal currentName={displayName} onClose={() => setShowNameModal(false)} onSaved={() => { setShowNameModal(false); fetchProfile(); user?.reload() }} />}
      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} />}
      {showThemeModal && <ThemeModal current={choice} onClose={() => setShowThemeModal(false)} />}
      {showMembershipModal && <MembershipModal currentTier={profile?.membershipTier || 'free'} onClose={() => setShowMembershipModal(false)} />}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { api, apiPut, apiPost, apiDelete } from '../../lib/api-client'
import { useToast } from '../Toast'
import { BRANDS } from '../../lib/constants'
const TIERS = ['free', 'monthly', 'annual', 'lifetime']
const STATUSES = ['active', 'disabled']

// ─── User Edit Modal ───
function UserEditModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [tier, setTier] = useState(user.membershipTier || 'free')
  const [status, setStatus] = useState(user.status || 'active')
  const [brands, setBrands] = useState<string[]>(user.configuredBrands || [])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  function toggleBrand(b: string) {
    setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])
  }

  function save() {
    setSaving(true)
    apiPut('/api/admin/users', { userId: user.id, membershipTier: tier, status, brands })
      .then(r => r.json())
      .then(d => {
        if (d.success) { onSaved(); toast('用户已更新', 'success') }
        else toast(d.error?.message || '保存失败', 'error')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h3 className="text-lg font-bold mb-4">编辑用户</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs">邮箱</span>
            <p className="text-white">{user.email || '—'}</p>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">会员等级</label>
            <select value={tier} onChange={e => setTier(e.target.value)} className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 ${!tier ? 'text-gray-500' : 'text-white'}`}>
              {TIERS.map(t => <option key={t} value={t} className="bg-[#1a2332] text-white">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">状态</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 ${!status ? 'text-gray-500' : 'text-white'}`}>
              {STATUSES.map(s => <option key={s} value={s} className="bg-[#1a2332] text-white">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">配置品牌（付费用户专属）</label>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map(b => (
                <label key={b} className={`px-2 py-1 rounded text-xs cursor-pointer ${brands.includes(b) ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <input type="checkbox" className="hidden" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 bg-white/10 py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-cyan-600 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Product Edit Modal ───
const PRODUCT_FIELDS = [
  { key: 'title', label: '标题', required: true },
  { key: 'brand', label: '品牌', required: true },
  { key: 'category', label: '品类' },
  { key: 'spec', label: '规格' },
  { key: 'price', label: '价格' },
  { key: 'currency', label: '币种', placeholder: 'CNY' },
  { key: 'source', label: '来源' },
  { key: 'sourceUrl', label: '来源链接' },
  { key: 'imageUrl', label: '图片 URL' },
  { key: 'country', label: '国家' },
] as const

function ProductEditModal({ product, onClose, onSaved }: { product?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!product
  const [form, setForm] = useState<Record<string, string>>({
    title: product?.title || '',
    brand: product?.brand || '',
    category: product?.category || '',
    spec: product?.spec || '',
    price: product?.price ?? '',
    currency: product?.currency || 'CNY',
    source: product?.source || '',
    sourceUrl: product?.sourceUrl || '',
    imageUrl: product?.imageUrl || '',
    country: product?.country || '',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function save() {
    if (!form.title || !form.brand) { toast('标题和品牌为必填', 'error'); return }
    setSaving(true)
    const body = isEdit ? { id: product.id, ...form } : form
    const fetcher = isEdit
      ? apiPut('/api/admin/products', body)
      : apiPost('/api/admin/products', body)
    fetcher
      .then(r => r.json())
      .then(d => {
        if (d.success) { onSaved(); toast(isEdit ? '商品已更新' : '商品已添加', 'success') }
        else toast(d.error?.message || '保存失败', 'error')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-bold mb-4">{isEdit ? '编辑商品' : '添加商品'}</h3>
        <div className="space-y-2">
          {PRODUCT_FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-gray-400 text-xs block mb-0.5">{f.label}{'required' in f && f.required ? ' *' : ''}</label>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={'placeholder' in f ? f.placeholder : undefined}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 bg-white/10 py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-cyan-600 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? '保存中...' : isEdit ? '更新' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Excel Import Modal ───
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [rows, setRows] = useState<any[] | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<any>(sheet)
    const errs: string[] = []
    data.forEach((row, i) => {
      if (!row.title) errs.push(`行 ${i + 2}: 缺少 title`)
      if (!row.brand) errs.push(`行 ${i + 2}: 缺少 brand`)
    })
    setRows(data)
    setPreview(data.slice(0, 5))
    setErrors(errs)
    setUploading(false)
  }

  function confirmImport() {
    if (!rows) return
    setImporting(true)
    apiPost('/api/admin/products', { import: 'confirm', rows })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const parts = [`导入 ${d.imported} 条`]
          if (d.skippedCount) parts.push(`跳过 ${d.skippedCount} 条重复`)
          if (d.failures?.length) parts.push(`失败 ${d.failures.length} 条`)
          onImported(); onClose(); toast(parts.join('，'), 'success')
        } else {
          toast(d.error?.message || '导入失败', 'error')
        }
      })
      .finally(() => setImporting(false))
  }

  async function downloadTemplate() {
    const XLSX = await import('xlsx')
    const headers = ['title', 'brand', 'category', 'spec', 'price', 'originalPrice', 'currency', 'source', 'sourceUrl', 'imageUrl', 'country', 'tags']
    const sampleRow = ['Osprey Atmos AG 65', 'Osprey', 'Backpack', '65L', 269.95, 340, 'USD', 'REI', 'https://www.rei.com/example', 'https://example.com/images/osprey-atmos.jpg', 'US', 'backpacking,lightweight']
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])
    // Column widths
    ws['!cols'] = headers.map(h => ({ wch: h === 'title' || h === 'sourceUrl' ? 28 : h === 'tags' ? 18 : 12 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '商品导入模板')
    XLSX.writeFile(wb, 'bibimiao_import_template.xlsx')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-bold mb-4">导入 Excel</h3>
        {!rows ? (
          <div className="space-y-4">
            <div className="bg-cyan-600/10 border border-cyan-600/30 rounded-lg p-3">
              <p className="text-xs text-gray-300 mb-2">请按照模板格式准备数据，必填列为 <b className="text-cyan-400">title</b> 和 <b className="text-cyan-400">brand</b></p>
              <button onClick={downloadTemplate} className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-cyan-500 transition-colors">
                📥 下载模板文件
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">选择文件：</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-gray-300 hover:file:bg-white/20" />
            </div>
            {uploading && <p className="text-gray-400 text-sm">解析中...</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">总行数: <b className="text-white">{rows.length}</b></span>
              <span className="text-green-400">有效: <b>{rows.length - errors.filter(e => e.includes('缺少')).length}</b></span>
              <span className="text-red-400">错误: <b>{errors.filter(e => e.includes('缺少')).length}</b></span>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-600/10 rounded-lg p-2 text-xs text-red-400 space-y-0.5 max-h-32 overflow-auto">
                {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
              </div>
            )}

            <p className="text-xs text-gray-400">前 5 行预览：</p>
            <div className="bg-white/5 rounded-lg p-2 text-xs max-h-32 overflow-auto">
              {preview.map((row, i) => (
                <p key={i} className="text-gray-300 py-0.5">{row.title} | {row.brand} | {row.currency} {row.price}</p>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-white/10 py-2 rounded-lg text-sm">取消</button>
              <button onClick={confirmImport} disabled={importing} className="flex-1 bg-cyan-600 py-2 rounded-lg text-sm disabled:opacity-50">
                {importing ? '导入中...' : `确认导入 ${rows.length - errors.filter(e => e.includes('缺少')).length} 条`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Admin Page ───
export default function AdminPage() {
  const { isSignedIn } = useUser()
  const { toast } = useToast()
  const loc = useLocation()
  const isUsers = loc.pathname.includes('users')
  const isProducts = loc.pathname.includes('products')

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<any>(null)
  const [editProduct, setEditProduct] = useState<any | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<{ totalPages: number; total: number } | null>(null)

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const allCurrentIds = data.map((p: any) => p.id)
  const allSelected = allCurrentIds.length > 0 && allCurrentIds.every((id: number) => selectedIds.has(id))

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allCurrentIds))
    }
  }

  function handleBatchDelete() {
    const ids = [...selectedIds]
    if (!confirm(`确认删除选中的 ${ids.length} 条商品？`)) return
    setBatchLoading(true)
    apiPost('/api/admin/products/batch-delete', { ids })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已删除 ${d.data.deleted} 条`, 'success') }
        else toast(d.error?.message || '批量删除失败', 'error')
      })
      .finally(() => setBatchLoading(false))
  }

  function handleBatchUpdate(field: string, value: string) {
    const ids = [...selectedIds]
    const label = field === 'status' ? '状态' : '品牌'
    if (!confirm(`确认将选中的 ${ids.length} 条商品的${label}改为「${value}」？`)) return
    setBatchLoading(true)
    apiPost('/api/admin/products/batch-update', { ids, field, value })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已更新 ${d.data.updated} 条`, 'success') }
        else toast(d.error?.message || '批量修改失败', 'error')
      })
      .finally(() => setBatchLoading(false))
  }

  const fetchData = useCallback((p = 1) => {
    setLoading(true)
    let url: string
    if (isUsers) {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (tierFilter) params.set('tier', tierFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(p))
      url = `/api/admin/users?${params}`
    } else if (isProducts) {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (brandFilter) params.set('brand', brandFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(p))
      url = `/api/admin/products?${params}`
    } else {
      url = '/api/products/overview'
    }
    api(url)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (isUsers || isProducts) {
            setData(d.data.items)
            setPagination(d.data.pagination)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [isUsers, isProducts, search, tierFilter, statusFilter, brandFilter])

  useEffect(() => { setPage(1); fetchData(1) }, [loc.pathname, search, tierFilter, statusFilter, brandFilter])
  useEffect(() => { fetchData(page) }, [page])

  if (!isSignedIn) return <div className="text-gray-400 p-4">请用管理员账号登录</div>
  if (loading) return <div className="text-gray-400 p-4">加载中...</div>

  // Dashboard
  if (!isUsers && !isProducts) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">管理仪表板</h1>
        <p className="text-gray-400">欢迎使用管理后台。选择左侧菜单管理用户或商品。</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{isUsers ? '用户管理' : '商品管理'}</h1>
        {isProducts && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddProduct(true)} className="bg-cyan-600 px-3 py-1.5 rounded text-xs">+ 添加商品</button>
            <button onClick={() => setShowImport(true)} className="bg-white/10 px-3 py-1.5 rounded text-xs">📥 导入 Excel</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="搜索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm w-40 ${!search ? 'text-gray-500' : 'text-white'}`}
        />
        {isUsers && (
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700">
            <option value="">全部等级</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {isProducts && (
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700">
            <option value="">全部品牌</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700">
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* User Table */}
      {isUsers && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b border-white/10"><th className="py-2">邮箱</th><th>等级</th><th>品牌</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="py-2 text-xs">{u.email}</td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${u.membershipTier === 'free' ? 'bg-gray-600' : 'bg-amber-600'}`}>{u.membershipTier}</span></td>
                <td className="text-xs text-gray-400">{(u.configuredBrands || []).join(', ') || '—'}</td>
                <td><span className={`text-xs ${u.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{u.status}</span></td>
                <td><button onClick={() => setEditUser(u)} className="text-cyan-400 text-xs hover:underline">编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Product Table */}
      {isProducts && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b border-white/10"><th className="py-2 w-8"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-3.5 h-3.5 accent-cyan-600 cursor-pointer" /></th><th className="py-2 w-10"></th><th className="py-2">标题</th><th>品牌</th><th>价格</th><th>来源</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {data.map(p => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-2"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-3.5 h-3.5 accent-cyan-600 cursor-pointer" /></td>
                <td className="py-2">
                  <img
                    src={p.imageUrl || `https://placehold.co/64x64/1a2332/06b6d4?text=${encodeURIComponent((p.brand || '').slice(0, 6))}`}
                    alt=""
                    className="w-8 h-8 rounded object-cover bg-white/5"
                    onError={e => {
                      const el = e.target as HTMLImageElement
                      el.src = 'https://placehold.co/64x64/1a2332/666?text=N%2FA'
                    }}
                  />
                </td>
                <td className="py-2 text-xs max-w-48 truncate">{p.title}</td>
                <td className="text-cyan-400 text-xs">{p.brand}</td>
                <td className="text-xs">{p.currency} {p.price}</td>
                <td className="text-xs text-gray-400">{p.source}</td>
                <td><span className={`text-xs ${p.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{p.status}</span></td>
                <td className="flex gap-2">
                  <button onClick={() => setEditProduct(p)} className="text-cyan-400 text-xs hover:underline">编辑</button>
                  <button onClick={() => {
                    if (!confirm('确认删除该商品？')) return
                    apiDelete('/api/admin/products', { id: p.id })
                      .then(r => r.json())
                      .then(d => {
                        if (d.success) { fetchData(page); toast('商品已删除', 'success') }
                        else toast(d.error?.message || '删除失败', 'error')
                      })
                      .catch(() => toast('网络错误', 'error'))
                  }} className="text-red-400 text-xs hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/10 text-gray-400 hover:bg-white/20 disabled:opacity-30">
            上一页
          </button>
          <span className="text-xs text-gray-400">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/10 text-gray-400 hover:bg-white/20 disabled:opacity-30">
            下一页
          </button>
        </div>
      )}

      {/* Batch action bar */}
      {selectedIds.size > 0 && isProducts && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0d1621] border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/50">
          <span className="text-xs text-gray-300">已选 <b className="text-white">{selectedIds.size}</b> 项</span>
          <button onClick={handleBatchDelete} disabled={batchLoading} className="bg-red-600/20 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-600/30 disabled:opacity-50 whitespace-nowrap">
            批量删除
          </button>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('status', v); e.target.value = '' } }}
            disabled={batchLoading}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 disabled:opacity-50"
          >
            <option value="" disabled>修改状态</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('brand', v); e.target.value = '' } }}
            disabled={batchLoading}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 disabled:opacity-50"
          >
            <option value="" disabled>修改品牌</option>
            {BRANDS.filter(b => typeof b === 'string').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button onClick={() => setSelectedIds(new Set())} disabled={batchLoading} className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50">
            取消选择
          </button>
        </div>
      )}

      {/* Modals */}
      {editUser && <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchData(page) }} />}
      {(editProduct || showAddProduct) && (
        <ProductEditModal
          product={editProduct || undefined}
          onClose={() => { setEditProduct(null); setShowAddProduct(false) }}
          onSaved={() => { setEditProduct(null); setShowAddProduct(false); fetchData(page) }}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => fetchData(page)} />}
    </div>
  )
}

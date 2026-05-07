import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { api, apiPut, apiPost, apiDelete } from '../../lib/api-client'
import { useToast } from '../Toast'
import ConfirmModal from '../ConfirmModal'
import { BRANDS } from '../../lib/constants'
import { formatPrice } from '../../lib/format'
const TIERS = ['free', 'monthly', 'annual', 'lifetime']
const STATUSES = ['active', 'disabled']

function statusLabel(s: string) { return s === 'active' ? '已启用' : s === 'disabled' ? '已停用' : s === 'inactive' ? '已停用' : s }
function tierLabel(t: string) { const m: Record<string, string> = { free: '免费', monthly: '月付', annual: '年付', lifetime: '终身' }; return m[t] || t }

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
      <div className="bg-[var(--admin-bg-card)] rounded-xl p-6 w-full max-w-md border border-[var(--admin-border)]">
        <h3 className="text-lg font-bold mb-4">编辑用户</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[var(--text-secondary)] text-xs">邮箱</span>
            <p className="text-[var(--text-primary)]">{user.email || '—'}</p>
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">会员等级</label>
            <select value={tier} onChange={e => setTier(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]">
              {TIERS.map(t => <option key={t} value={t} className="bg-[var(--bg-input)] text-[var(--text-primary)]">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">状态</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]">
              {STATUSES.map(s => <option key={s} value={s} className="bg-[var(--bg-input)] text-[var(--text-primary)]">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-1">配置品牌（付费用户专属）</label>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map(b => (
                <label key={b} className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${brands.includes(b) ? 'bg-[var(--brand)] text-[var(--button-on-brand)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                  <input type="checkbox" className="hidden" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-hover)] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
      <div className="bg-[var(--admin-bg-card)] rounded-xl p-6 w-full max-w-md border border-[var(--admin-border)] max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-bold mb-4">{isEdit ? '编辑商品' : '添加商品'}</h3>
        <div className="space-y-2">
          {PRODUCT_FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">{f.label}{'required' in f && f.required ? ' *' : ''}</label>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={'placeholder' in f ? f.placeholder : undefined}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)]"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-hover)] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
            {saving ? '保存中...' : isEdit ? '更新' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    ws['!cols'] = headers.map(h => ({ wch: h === 'title' || h === 'sourceUrl' ? 28 : h === 'tags' ? 18 : 12 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '商品导入模板')
    XLSX.writeFile(wb, 'bibimiao_import_template.xlsx')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[var(--admin-bg-card)] rounded-xl p-6 w-full max-w-lg border border-[var(--admin-border)] max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-bold mb-4">导入 Excel</h3>
        {!rows ? (
          <div className="space-y-4">
            <div className="bg-[var(--brand-soft)] border border-[var(--brand-soft)] rounded-lg p-3">
              <p className="text-xs text-[var(--text-secondary)] mb-2">请按照模板格式准备数据，必填列为 <b className="text-[var(--brand)]">title</b> 和 <b className="text-[var(--brand)]">brand</b></p>
              <button onClick={downloadTemplate} className="bg-[var(--brand)] text-[var(--button-on-brand)] px-4 py-2 rounded-lg text-xs hover:bg-[var(--brand-hover)] active:bg-[var(--brand-hover)] transition-colors">
                下载模板文件
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)]">选择文件：</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm text-[var(--text-secondary)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[var(--bg-hover)] file:text-[var(--text-primary)] hover:file:bg-[var(--bg-hover)]" />
            </div>
            {uploading && <p className="text-[var(--text-secondary)] text-sm">解析中...</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="text-[var(--text-secondary)]">总行数: <b className="text-[var(--text-primary)]">{rows.length}</b></span>
              <span className="text-[var(--success)]">有效: <b>{rows.length - errors.filter(e => e.includes('缺少')).length}</b></span>
              <span className="text-[var(--danger)]">错误: <b>{errors.filter(e => e.includes('缺少')).length}</b></span>
            </div>

            {errors.length > 0 && (
              <div className="bg-[var(--danger)]/10 rounded-lg p-2 text-xs text-[var(--danger)] space-y-0.5 max-h-32 overflow-auto">
                {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
              </div>
            )}

            <p className="text-xs text-[var(--text-secondary)]">前 5 行预览：</p>
            <div className="bg-[var(--bg-hover)] rounded-lg p-2 text-xs max-h-32 overflow-auto">
              {preview.map((row, i) => (
                <p key={i} className="text-[var(--text-primary)] py-0.5">{row.title} | {row.brand} | {formatPrice(row.currency, row.price)}</p>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-[var(--bg-hover)] py-2 rounded-lg text-sm">取消</button>
              <button onClick={confirmImport} disabled={importing} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
                {importing ? '导入中...' : `确认导入 ${rows.length - errors.filter(e => e.includes('缺少')).length} 条`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CarrierEditModal({ carrier, onClose, onSaved }: { carrier?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!carrier
  const [name, setName] = useState(carrier?.name || '')
  const [firstWeight, setFW] = useState(String(carrier?.firstWeight ?? '1.0'))
  const [firstCost, setFC] = useState(String(carrier?.firstCost ?? '23'))
  const [additionalWeight, setAW] = useState(String(carrier?.additionalWeight ?? '0.5'))
  const [additionalCost, setAC] = useState(String(carrier?.additionalCost ?? '5'))
  const [volumeDivisor, setVD] = useState(String(carrier?.volumeDivisor ?? '6000'))
  const [isActive, setIsActive] = useState(carrier?.isActive ?? 'active')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  function save() {
    if (!name.trim()) { toast('快递名称不能为空', 'error'); return }
    setSaving(true)
    const body = isEdit
      ? { id: carrier.id, name, firstWeight, firstCost, additionalWeight, additionalCost, volumeDivisor, isActive }
      : { name, firstWeight, firstCost, additionalWeight, additionalCost, volumeDivisor, isActive }
    const fetcher = isEdit
      ? apiPut('/api/admin/shipping-carriers', body)
      : apiPost('/api/admin/shipping-carriers', body)
    fetcher
      .then(r => r.json())
      .then(d => {
        if (d.success) { onSaved(); toast(isEdit ? '快递已更新' : '快递已添加', 'success') }
        else toast(d.error?.message || '保存失败', 'error')
      })
      .catch((e: Error) => toast(e.message || '网络错误', 'error'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[var(--admin-bg-card)] rounded-xl p-6 w-full max-w-sm border border-[var(--admin-border)]">
        <h3 className="text-lg font-bold mb-4">{isEdit ? '编辑快递' : '添加快递'}</h3>
        <div className="space-y-2.5 text-sm">
          <div>
            <label className="text-[var(--text-secondary)] text-xs block mb-0.5">名称 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="顺丰"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">首重 (kg)</label>
              <input type="number" step="0.1" min="0" value={firstWeight} onChange={e => setFW(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">首重价格 (元)</label>
              <input type="number" step="0.01" min="0" value={firstCost} onChange={e => setFC(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">续重 (kg)</label>
              <input type="number" step="0.1" min="0" value={additionalWeight} onChange={e => setAW(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">续重价格 (元)</label>
              <input type="number" step="0.01" min="0" value={additionalCost} onChange={e => setAC(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">体积除数</label>
              <input type="number" step="100" min="1000" value={volumeDivisor} onChange={e => setVD(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-xs block mb-0.5">状态</label>
              <select value={isActive} onChange={e => setIsActive(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)]">
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-hover)] py-2 rounded-lg text-sm">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[var(--brand)] py-2 rounded-lg text-sm disabled:opacity-50 active:bg-[var(--brand-hover)] transition-colors">
            {saving ? '保存中...' : isEdit ? '更新' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const [input, setInput] = useState(String(page))

  useEffect(() => { setInput(String(page)) }, [page])

  function jump() {
    const n = parseInt(input, 10)
    if (n >= 1 && n <= totalPages && n !== page) onChange(n)
    else setInput(String(page))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') jump()
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      <div className="flex items-center justify-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30">
          上一页
        </button>
        <span className="text-xs text-[var(--text-secondary)]">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30">
          下一页
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <span>跳至</span>
        <input
          className="w-12 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-center text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand)]"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
        />
        <button
          onClick={jump}
          className="bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg px-2 py-1 transition-colors"
        >
          跳转
        </button>
        <span className="text-[var(--text-secondary)]/70">/ {totalPages} 页</span>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { isSignedIn } = useUser()
  const { toast } = useToast()
  const loc = useLocation()
  const isUsers = loc.pathname.includes('users')
  const isProducts = loc.pathname.includes('products')
  const isCarriers = loc.pathname.includes('carriers')

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<any>(null)
  const [editProduct, setEditProduct] = useState<any | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<{ totalPages: number; total: number } | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // Dashboard stats
  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    if (!isUsers && !isProducts && !isCarriers) {
      api('/api/products/overview').then(r => r.json()).then(d => { if (d.success) setOverview(d.data) }).catch(() => {})
    }
  }, [loc.pathname])

  // Carrier state
  const [editCarrier, setEditCarrier] = useState<any>(null)
  const [showAddCarrier, setShowAddCarrier] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null>(null)

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
    if (allSelected) { setSelectedIds(new Set()) }
    else { setSelectedIds(new Set(allCurrentIds)) }
  }

  function handleBatchDelete() {
    const ids = [...selectedIds]
    setConfirmModal({
      show: true, title: '确认删除', danger: true, confirmLabel: '删除',
      message: `确认删除选中的 ${ids.length} 条商品？此操作不可撤销。`,
      onConfirm: () => {
        setConfirmModal(null)
        setBatchLoading(true)
        apiPost('/api/admin/products/batch-delete', { ids })
          .then(r => r.json())
          .then(d => {
            if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已删除 ${d.data.deleted} 条`, 'success') }
            else toast(d.error?.message || '批量删除失败', 'error')
          })
          .finally(() => setBatchLoading(false))
      }
    })
  }

  function handleBatchUpdate(field: string, value: string) {
    const ids = [...selectedIds]
    const label = field === 'status' ? '状态' : '品牌'
    setConfirmModal({
      show: true, title: '确认修改', confirmLabel: '确认修改',
      message: `确认将选中的 ${ids.length} 条商品的${label}改为「${value}」？`,
      onConfirm: () => {
        setConfirmModal(null)
        setBatchLoading(true)
        apiPost('/api/admin/products/batch-update', { ids, field, value })
          .then(r => r.json())
          .then(d => {
            if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已更新 ${d.data.updated} 条`, 'success') }
            else toast(d.error?.message || '批量修改失败', 'error')
          })
          .finally(() => setBatchLoading(false))
      }
    })
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
    } else if (isCarriers) {
      url = '/api/admin/shipping-carriers'
    } else {
      url = '/api/products/overview'
    }
    api(url)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (isCarriers) {
            setData(d.data)
            setPagination(null)
          } else if (isUsers || isProducts) {
            setData(d.data.items)
            setPagination(d.data.pagination)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [isUsers, isProducts, isCarriers, search, tierFilter, statusFilter, brandFilter])

  useEffect(() => { setPage(1); fetchData(1) }, [loc.pathname, search, tierFilter, statusFilter, brandFilter])
  useEffect(() => { fetchData(page) }, [page])

  if (!isSignedIn) return <div className="text-[var(--text-secondary)] p-4">请用管理员账号登录</div>
  if (loading) return <div className="text-[var(--text-secondary)] p-4">加载中...</div>

  if (!isUsers && !isProducts && !isCarriers) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6">管理仪表板</h1>
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)]">
              <div className="text-2xl font-bold text-[var(--brand)]">{overview.totalProducts}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">商品总数</div>
            </div>
            <div className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)]">
              <div className="text-2xl font-bold text-[var(--brand)]">{overview.brandCount}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">品牌数量</div>
            </div>
            <div className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)]">
              <div className="text-2xl font-bold text-[var(--brand)]">{overview.sourceCount}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">来源站点</div>
            </div>
          </div>
        )}
        {overview && (overview.noImageCount > 0 || overview.noSourceCount > 0) && (
          <div className="mb-6">
            <h2 className="text-sm text-[var(--text-secondary)] mb-3">待完善</h2>
            <div className="grid grid-cols-2 gap-3">
              {overview.noImageCount > 0 && (
                <a href="/admin/products" className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--warning)]/30 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="text-xl font-bold text-[var(--warning)]">{overview.noImageCount}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">缺图商品</div>
                </a>
              )}
              {overview.noSourceCount > 0 && (
                <a href="/admin/products" className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--warning)]/30 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="text-xl font-bold text-[var(--warning)]">{overview.noSourceCount}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">缺来源商品</div>
                </a>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="/admin/products" className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)] hover:bg-[var(--bg-hover)] transition-colors">
            <div className="text-sm font-medium text-[var(--text-primary)]">商品管理</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">浏览、搜索、编辑和导入商品</div>
          </a>
          <a href="/admin/users" className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)] hover:bg-[var(--bg-hover)] transition-colors">
            <div className="text-sm font-medium text-[var(--text-primary)]">用户管理</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">管理用户等级、品牌权限和状态</div>
          </a>
          <a href="/admin/carriers" className="bg-[var(--admin-bg-card)] rounded-xl p-4 border border-[var(--admin-border)] hover:bg-[var(--bg-hover)] transition-colors">
            <div className="text-sm font-medium text-[var(--text-primary)]">快递管理</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">配置国际运费模板和参数</div>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{isUsers ? '用户管理' : isCarriers ? '快递管理' : '商品管理'}</h1>
        {isProducts && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddProduct(true)} className="bg-[var(--brand)] px-3 py-1.5 rounded text-xs active:bg-[var(--brand-hover)] transition-colors">+ 添加商品</button>
            <button onClick={() => setShowImport(true)} className="bg-[var(--bg-hover)] px-3 py-1.5 rounded text-xs active:bg-[var(--bg-hover)] transition-colors">导入 Excel</button>
          </div>
        )}
        {isCarriers && (
          <button onClick={() => setShowAddCarrier(true)} className="bg-[var(--brand)] px-3 py-1.5 rounded text-xs active:bg-[var(--brand-hover)] transition-colors">+ 添加快递</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="搜索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm w-40 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
        />
        {isUsers && (
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]">
            <option value="">全部等级</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {isProducts && (
          <>
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="">全部品牌</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={quickFilter} onChange={e => setQuickFilter(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="">快捷筛选</option>
              <option value="noImage">缺图商品</option>
              <option value="noSource">缺来源商品</option>
            </select>
          </>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)]">
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {/* User Table */}
      {isUsers && (
        <div className="overflow-x-auto -mx-4 px-4">
          {!loading && data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[var(--text-secondary)]">暂无用户数据</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">用户注册后将出现在这里</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[480px]">
              <thead><tr className="text-left text-[var(--text-secondary)] border-b border-[var(--admin-border)]"><th className="py-2.5 font-medium">邮箱</th><th className="py-2.5 font-medium">等级</th><th className="py-2.5 font-medium">品牌</th><th className="py-2.5 font-medium">状态</th><th className="py-2.5 font-medium">更新时间</th><th className="py-2.5 font-medium">操作</th></tr></thead>
              <tbody>
                {data.map(u => (
                  <tr key={u.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--bg-hover)]/50 transition-colors">
                    <td className="py-3 text-xs">{u.email}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${u.membershipTier === 'free' ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>{tierLabel(u.membershipTier)}</span></td>
                    <td className="py-3 text-xs text-[var(--text-secondary)]">{(u.configuredBrands || []).join(', ') || '—'}</td>
                    <td className="py-3"><span className={`text-xs ${u.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{statusLabel(u.status)}</span></td>
                    <td className="py-3 text-[10px] text-[var(--text-muted)] whitespace-nowrap">{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                    <td className="py-3"><button onClick={() => setEditUser(u)} className="bg-[var(--brand-soft)] text-[var(--brand)] px-3 py-1 rounded text-xs hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors">编辑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Carrier Table */}
      {isCarriers && (
        <div className="overflow-x-auto -mx-4 px-4">
          {!loading && data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[var(--text-secondary)]">暂无快递数据</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">点击「新增加快递」添加运费模板</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="text-left text-[var(--text-secondary)] border-b border-[var(--admin-border)]"><th className="py-2.5 font-medium">名称</th><th className="py-2.5 font-medium">首重(kg)</th><th className="py-2.5 font-medium">首重价格</th><th className="py-2.5 font-medium">续重(kg)</th><th className="py-2.5 font-medium">续重价格</th><th className="py-2.5 font-medium">体积除数</th><th className="py-2.5 font-medium">状态</th><th className="py-2.5 font-medium">更新时间</th><th className="py-2.5 font-medium">操作</th></tr></thead>
              <tbody>
                {data.map((c: any) => (
                  <tr key={c.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--bg-hover)]/50 transition-colors">
                    <td className="py-3 text-xs font-medium">{c.name}</td>
                    <td className="py-3 text-xs">{c.firstWeight}</td>
                    <td className="py-3 text-xs">¥{c.firstCost}</td>
                    <td className="py-3 text-xs">{c.additionalWeight}</td>
                    <td className="py-3 text-xs">¥{c.additionalCost}</td>
                    <td className="py-3 text-xs">{c.volumeDivisor}</td>
                    <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded ${c.isActive === 'active' ? 'bg-[var(--brand-soft)] text-[var(--success)]' : 'bg-[var(--bg-hover)] text-[var(--danger)]'}`}>{c.isActive === 'active' ? '已启用' : '已停用'}</span></td>
                    <td className="py-3 text-[10px] text-[var(--text-muted)] whitespace-nowrap">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                    <td className="py-3 whitespace-nowrap">
                      <button onClick={() => setEditCarrier(c)} className="bg-[var(--brand-soft)] text-[var(--brand)] px-3 py-1 rounded text-xs hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors">编辑</button>
                      <button onClick={() => {
                        setConfirmModal({
                          show: true, title: '确认删除', danger: true, confirmLabel: '删除',
                          message: `确认删除快递「${c.name}」？`,
                          onConfirm: () => {
                            setConfirmModal(null)
                            apiDelete('/api/admin/shipping-carriers', { id: c.id })
                              .then(r => r.json())
                              .then(d => {
                                if (d.success) { fetchData(page); toast('已删除', 'success') }
                                else toast(d.error?.message || '删除失败', 'error')
                              })
                              .catch(() => toast('网络错误', 'error'))
                          }
                        })
                      }} className="bg-[var(--danger)]/10 text-[var(--danger)] px-3 py-1 rounded text-xs hover:bg-[var(--danger)]/20 active:bg-[var(--danger)]/20 transition-colors ml-2">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Product Table */}
      {isProducts && (() => {
        const displayData = quickFilter === 'noImage' ? data.filter((p: any) => !p.imageUrl)
          : quickFilter === 'noSource' ? data.filter((p: any) => !p.source)
          : data
        if (!loading && displayData.length === 0) return (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--text-secondary)]">暂无商品数据</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{data.length === 0 ? '可以手动添加商品，或通过 Excel 批量导入' : '当前筛选条件下无匹配商品'}</p>
          </div>
        )
        return (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-[var(--text-secondary)] border-b border-[var(--admin-border)]"><th className="py-2.5 w-8 font-medium"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer" /></th><th className="py-2.5 w-10 font-medium"></th><th className="py-2.5 font-medium">标题</th><th className="py-2.5 font-medium">品牌</th><th className="py-2.5 font-medium">价格</th><th className="py-2.5 font-medium">来源</th><th className="py-2.5 font-medium">状态</th><th className="py-2.5 font-medium">更新时间</th><th className="py-2.5 font-medium">操作</th></tr></thead>
          <tbody>
            {displayData.map(p => (
              <tr key={p.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--bg-hover)]/50 transition-colors">
                <td className="py-3"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer" /></td>
                <td className="py-3">
                  <img
                    src={p.imageUrl || `https://placehold.co/64x64/1a1a17/d97757?text=${encodeURIComponent((p.brand || '').slice(0, 6))}`}
                    alt=""
                    className="w-8 h-8 rounded object-cover bg-[var(--bg-hover)]"
                    loading="lazy"
                    onError={e => {
                      const el = e.target as HTMLImageElement
                      el.src = `https://placehold.co/64x64/1a1a17/666?text=${encodeURIComponent('暂无')}`
                    }}
                  />
                </td>
                <td className="py-3 text-xs max-w-48 truncate">{p.title}</td>
                <td className="py-3 text-[var(--brand)] text-xs">{p.brand}</td>
                <td className="py-3 text-xs font-mono tabular-nums">{formatPrice(p.currency, p.price)}</td>
                <td className="py-3 text-xs text-[var(--text-secondary)]">{p.source}</td>
                <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-[var(--brand-soft)] text-[var(--success)]' : 'bg-[var(--bg-hover)] text-[var(--danger)]'}`}>{statusLabel(p.status)}</span></td>
                <td className="py-3 text-[10px] text-[var(--text-muted)] whitespace-nowrap">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                <td className="py-3 whitespace-nowrap">
                  <button onClick={() => setEditProduct(p)} className="bg-[var(--brand-soft)] text-[var(--brand)] px-3 py-1 rounded text-xs hover:bg-[var(--brand)]/20 active:bg-[var(--brand)]/20 transition-colors">编辑</button>
                  <button onClick={() => {
                    setConfirmModal({
                      show: true, title: '确认删除', danger: true, confirmLabel: '删除',
                      message: `确认删除商品「${p.title}」？`,
                      onConfirm: () => {
                        setConfirmModal(null)
                        apiDelete('/api/admin/products', { id: p.id })
                          .then(r => r.json())
                          .then(d => {
                            if (d.success) { fetchData(page); toast('商品已删除', 'success') }
                            else toast(d.error?.message || '删除失败', 'error')
                          })
                          .catch(() => toast('网络错误', 'error'))
                      }
                    })
                  }} className="bg-[var(--danger)]/10 text-[var(--danger)] px-3 py-1 rounded text-xs hover:bg-[var(--danger)]/20 active:bg-[var(--danger)]/20 transition-colors ml-2">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )})()}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={pagination.totalPages}
          onChange={setPage}
        />
      )}

      {/* Batch action bar */}
      {selectedIds.size > 0 && isProducts && (
        <div className="fixed bottom-4 left-2 right-2 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-[var(--admin-bg-sidebar)] border border-[var(--admin-border)] rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2 shadow-2xl shadow-black/50 max-w-full">
          <span className="text-xs text-[var(--text-secondary)]">已选 <b className="text-[var(--text-primary)]">{selectedIds.size}</b> 项</span>
          <button onClick={handleBatchDelete} disabled={batchLoading} className="bg-[var(--danger)]/10 text-[var(--danger)] px-3 py-1 rounded text-xs hover:bg-[var(--danger)]/10 disabled:opacity-50 whitespace-nowrap">
            批量删除
          </button>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('status', v); e.target.value = '' } }}
            disabled={batchLoading}
            className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
          >
            <option value="" disabled>修改状态</option>
            <option value="active">已启用</option>
            <option value="inactive">已停用</option>
          </select>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('brand', v); e.target.value = '' } }}
            disabled={batchLoading}
            className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
          >
            <option value="" disabled>修改品牌</option>
            {BRANDS.filter(b => typeof b === 'string').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button onClick={() => setSelectedIds(new Set())} disabled={batchLoading} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:text-[var(--text-primary)] disabled:opacity-50 py-0.5">
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
      {(editCarrier || showAddCarrier) && (
        <CarrierEditModal
          carrier={editCarrier || undefined}
          onClose={() => { setEditCarrier(null); setShowAddCarrier(false) }}
          onSaved={() => { setEditCarrier(null); setShowAddCarrier(false); fetchData(page) }}
        />
      )}
      {confirmModal?.show && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

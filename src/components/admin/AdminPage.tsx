import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useLocation, Link } from 'react-router-dom'
import { api, apiPut, apiPost, apiDelete } from '../../lib/api-client'
import { useToast } from '../Toast'
import { getPlaceholderUrl } from '../../lib/format'
import ConfirmModal from '../ConfirmModal'
import { BRANDS } from '../../lib/constants'
import { formatPrice } from '../../lib/format'
const TIERS = ['free', 'monthly', 'annual']
const STATUSES = ['active', 'disabled']

function statusLabel(s: string) { return s === 'active' ? '上架' : s === 'disabled' ? '禁用' : s === 'inactive' ? '禁用' : s }
function tierLabel(t: string) { const m: Record<string, string> = { free: '免费', monthly: '月付', annual: '年付' }; return m[t] || t }
function maskEmail(email: string, isAdmin: boolean): string {
  if (!email || isAdmin) return email
  const [name, domain] = email.split('@')
  if (!domain) return email
  if (name.length <= 2) return name[0] + '***@' + domain
  return name[0] + '***' + name[name.length - 1] + '@' + domain
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--overlay)', padding: '16px',
}

const modalBox: React.CSSProperties = {
  background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)',
  padding: '24px', width: '100%', maxWidth: '448px',
}

const inputClass: React.CSSProperties = {
  width: '100%', background: 'var(--bg-input)', border: 'var(--border-width) solid var(--border-default)',
  padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none',
  padding: '8px 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)',
  padding: '8px 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
  color: 'var(--text-primary)',
}

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
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalBox}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>编辑用户</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</span>
            <p style={{ fontSize: '13px', margin: '2px 0 0' }}>{maskEmail(user.email, user.role === 'admin')}</p>
          </div>
          <div>
            <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Membership Tier</label>
            <select value={tier} onChange={e => setTier(e.target.value)} style={inputClass}>
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputClass}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Configured Brands</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {BRANDS.map(b => (
                <label key={b} style={{
                  padding: '4px 8px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                  background: brands.includes(b) ? 'var(--bg-active)' : 'var(--bg-hover)',
                  color: brands.includes(b) ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.4 : 1 }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

const PRODUCT_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'brand', label: 'Brand', required: true },
  { key: 'category', label: 'Category' },
  { key: 'spec', label: 'Spec' },
  { key: 'price', label: 'Price' },
  { key: 'currency', label: 'Currency', placeholder: 'CNY' },
  { key: 'source', label: 'Source' },
  { key: 'sourceUrl', label: 'Source URL' },
  { key: 'imageUrl', label: 'Image URL' },
  { key: 'country', label: 'Country' },
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
    if (!form.title || !form.brand) { toast('标题和品牌必填', 'error'); return }
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
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalBox, maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>{isEdit ? '编辑商品' : '新增商品'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRODUCT_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>{f.label}{'required' in f && f.required ? ' *' : ''}</label>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={'placeholder' in f ? f.placeholder : undefined}
                style={inputClass}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.4 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
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
      if (!row.title) errs.push(`Row ${i + 2}: missing title`)
      if (!row.brand) errs.push(`Row ${i + 2}: missing brand`)
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
          const parts = [`Imported ${d.imported} rows`]
          if (d.skippedCount) parts.push(`Skipped ${d.skippedCount} duplicates`)
          if (d.failures?.length) parts.push(`Failed ${d.failures.length} rows`)
          onImported(); onClose(); toast(parts.join(', '), 'success')
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
    XLSX.utils.book_append_sheet(wb, ws, 'Import Template')
    XLSX.writeFile(wb, 'bibimiao_import_template.xlsx')
  }

  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalBox, maxWidth: '512px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>导入 Excel</h3>
        {!rows ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--brand-soft)', border: 'var(--border-width) solid var(--border-default)', padding: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Prepare data in template format. Required columns: <b style={{ color: 'var(--brand)' }}>title</b> and <b style={{ color: 'var(--brand)' }}>brand</b></p>
              <button onClick={downloadTemplate} style={{ ...btnPrimary, fontSize: '14px', padding: '8px 16px' }}>
                Download Template
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select file:</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ fontSize: '13px', color: 'var(--text-secondary)' }} />
            </div>
            {uploading && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Parsing...</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total: <b style={{ color: 'var(--text-primary)' }}>{rows.length}</b></span>
              <span style={{ color: 'var(--success)' }}>Valid: <b>{rows.length - errors.filter(e => e.includes('missing')).length}</b></span>
              <span style={{ color: 'var(--danger)' }}>Errors: <b>{errors.filter(e => e.includes('missing')).length}</b></span>
            </div>

            {errors.length > 0 && (
              <div style={{ background: 'var(--danger)', padding: '8px', fontSize: '14px', color: 'var(--text-inverse)', maxHeight: '128px', overflow: 'auto' }}>
                {errors.map((e, i) => <p key={i} style={{ margin: '2px 0' }}>⚠ {e}</p>)}
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>First 5 rows preview:</p>
            <div style={{ background: 'var(--bg-hover)', border: 'var(--border-width) solid var(--border-default)', padding: '8px', fontSize: '14px', maxHeight: '128px', overflow: 'auto' }}>
              {preview.map((row, i) => (
                <p key={i} style={{ color: 'var(--text-primary)', margin: '2px 0' }}>{row.title} | {row.brand} | {formatPrice(row.currency, row.price)}</p>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
              <button onClick={confirmImport} disabled={importing} style={{ ...btnPrimary, opacity: importing ? 0.4 : 1 }}>
                {importing ? 'Importing...' : `Import ${rows.length - errors.filter(e => e.includes('missing')).length} rows`}
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
    if (!name.trim()) { toast('名称不能为空', 'error'); return }
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
        if (d.success) { onSaved(); toast(isEdit ? '承运商已更新' : '承运商已添加', 'success') }
        else toast(d.error?.message || '保存失败', 'error')
      })
      .catch((e: Error) => toast(e.message || '网络错误', 'error'))
      .finally(() => setSaving(false))
  }

  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalBox, maxWidth: '360px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 16px' }}>{isEdit ? '编辑承运商' : '新增承运商'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="SF Express" style={inputClass} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>First Weight (kg)</label>
              <input type="number" step="0.1" min="0" value={firstWeight} onChange={e => setFW(e.target.value)} style={inputClass} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>First Cost (yuan)</label>
              <input type="number" step="0.01" min="0" value={firstCost} onChange={e => setFC(e.target.value)} style={inputClass} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Add. Weight (kg)</label>
              <input type="number" step="0.1" min="0" value={additionalWeight} onChange={e => setAW(e.target.value)} style={inputClass} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Add. Cost (yuan)</label>
              <input type="number" step="0.01" min="0" value={additionalCost} onChange={e => setAC(e.target.value)} style={inputClass} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Vol Divisor</label>
              <input type="number" step="100" min="1000" value={volumeDivisor} onChange={e => setVD(e.target.value)} style={inputClass} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Status</label>
              <select value={isActive} onChange={e => setIsActive(e.target.value)} style={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Disabled</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '20px' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.4 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          style={{ ...btnSecondary, opacity: page <= 1 ? 0.4 : 1, fontSize: '14px' }}>
          Prev
        </button>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          style={{ ...btnSecondary, opacity: page >= totalPages ? 0.4 : 1, fontSize: '14px' }}>
          Next
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        <span>Go to</span>
        <input
          style={{ width: '48px', background: 'var(--bg-input)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', textAlign: 'center', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
        />
        <button onClick={jump} style={{ ...btnSecondary, fontSize: '14px', padding: '4px 8px' }}>Go</button>
        <span style={{ opacity: 0.7 }}>/ {totalPages} pages</span>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 640) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const [batchLoading, setBatchLoading] = useState(false)

  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    if (!isUsers && !isProducts && !isCarriers) {
      api('/api/products/overview').then(r => r.json()).then(d => { if (d.success) setOverview(d.data) }).catch(() => {})
    }
    // Read quickFilter from URL search params
    const sp = new URLSearchParams(loc.search)
    if (sp.get('missingImage') === '1') setQuickFilter('noImage')
    else if (sp.get('missingSource') === '1') setQuickFilter('noSource')
    else if (!loc.search.includes('missingImage') && !loc.search.includes('missingSource')) setQuickFilter('')
  }, [loc.pathname, loc.search])

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
      message: `确定删除选中的 ${ids.length} 个商品？此操作不可撤销。`,
      onConfirm: () => {
        setConfirmModal(null)
        setBatchLoading(true)
        apiPost('/api/admin/products/batch-delete', { ids })
          .then(r => r.json())
          .then(d => {
            if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已删除 ${d.data.deleted} 项`, 'success') }
            else toast(d.error?.message || '批量删除失败', 'error')
          })
          .finally(() => setBatchLoading(false))
      }
    })
  }

  function handleBatchUpdate(field: string, value: string) {
    const ids = [...selectedIds]
    const label = field === 'status' ? 'Status' : 'Brand'
    setConfirmModal({
      show: true, title: 'Confirm Update', confirmLabel: 'Update',
      message: `将 ${ids.length} 个选中商品的${label}修改为 "${value}"？`,
      onConfirm: () => {
        setConfirmModal(null)
        setBatchLoading(true)
        apiPost('/api/admin/products/batch-update', { ids, field, value })
          .then(r => r.json())
          .then(d => {
            if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已更新 ${d.data.updated} 项`, 'success') }
            else toast(d.error?.message || '批量更新失败', 'error')
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
      if (quickFilter === 'noImage') params.set('missingImage', '1')
      if (quickFilter === 'noSource') params.set('missingSource', '1')
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
  }, [isUsers, isProducts, isCarriers, search, tierFilter, statusFilter, brandFilter, quickFilter])

  useEffect(() => { setPage(1); fetchData(1) }, [loc.pathname, search, tierFilter, statusFilter, brandFilter, quickFilter])
  useEffect(() => { fetchData(page) }, [page])

  if (!isSignedIn) return <div style={{ color: 'var(--text-secondary)', padding: '16px' }}>请用管理员账号登录</div>
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '16px' }}>加载中...</div>

  if (!isUsers && !isProducts && !isCarriers) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 24px' }}>管理后台</h1>
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{overview.totalProducts}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>商品总数</div>
            </div>
            <div style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{overview.brandCount}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>品牌</div>
            </div>
            <div style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{overview.sourceCount}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>来源</div>
            </div>
          </div>
        )}
        {overview && (overview.noImageCount > 0 || overview.noSourceCount > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px' }}>待处理</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              {overview.noImageCount > 0 && (
                <Link to="/admin/products?missingImage=1" style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--warning)', padding: '16px', textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{overview.noImageCount}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>缺少图片</div>
                </Link>
              )}
              {overview.noSourceCount > 0 && (
                <Link to="/admin/products?missingSource=1" style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--warning)', padding: '16px', textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{overview.noSourceCount}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>缺少来源</div>
                </Link>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          <Link to="/admin/products" style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', textDecoration: 'none' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>商品管理</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>浏览、搜索、编辑和导入商品</div>
          </Link>
          <Link to="/admin/users" style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', textDecoration: 'none' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>用户管理</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>管理等级、品牌权限和状态</div>
          </Link>
          <Link to="/admin/carriers" style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '16px', textDecoration: 'none' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>承运商</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>配置运费模板</div>
          </Link>
        </div>
      </div>
    )
  }

  const thStyle: React.CSSProperties = { padding: '10px 8px', fontWeight: 700, fontSize: 'var(--fs-label)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'left' }
  const tdStyle: React.CSSProperties = { padding: '12px 8px', fontSize: '13px', borderBottom: 'var(--border-width) solid var(--admin-border)' }
  const filterInput: React.CSSProperties = { background: 'var(--bg-input)', border: 'var(--border-width) solid var(--border-default)', padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }
  const tagBase: React.CSSProperties = { padding: '2px 8px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0 }}>
          {isUsers ? '用户管理' : isCarriers ? '承运商管理' : '商品管理'}
        </h1>
        {isProducts && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAddProduct(true)} style={btnPrimary}>+ 新增商品</button>
            <button onClick={() => setShowImport(true)} style={btnSecondary}>导入 Excel</button>
          </div>
        )}
        {isCarriers && (
          <button onClick={() => setShowAddCarrier(true)} style={btnPrimary}>+ 新增承运商</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <input
          placeholder="搜索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...filterInput, width: '160px' }}
        />
        {isUsers && (
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={filterInput}>
            <option value="">全部等级</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {isProducts && (
          <>
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={filterInput}>
              <option value="">全部品牌</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={quickFilter} onChange={e => setQuickFilter(e.target.value)} style={filterInput}>
              <option value="">快速筛选</option>
              <option value="noImage">缺少图片</option>
              <option value="noSource">缺少来源</option>
            </select>
          </>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterInput}>
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {/* User Table / Cards */}
      {isUsers && (
        <>
          {!loading && data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>暂无用户数据</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>用户注册后将显示在此处</p>
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.map(u => (
                <div key={u.id} style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{maskEmail(u.email, u.role === 'admin')}</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ ...tagBase, background: u.membershipTier === 'free' ? 'var(--bg-hover)' : 'var(--brand-soft)', color: u.membershipTier === 'free' ? 'var(--text-secondary)' : 'var(--brand)' }}>{tierLabel(u.membershipTier)}</span>
                        {u.role === 'admin' && <span style={{ ...tagBase, background: 'var(--admin-badge)', color: 'var(--text-inverse)' }}>Admin</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: u.status === 'active' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{statusLabel(u.status)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <div>品牌权限: {(u.configuredBrands || []).join(', ') || '—'}</div>
                    <div style={{ marginTop: '2px' }}>更新: {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</div>
                  </div>
                  <button onClick={() => setEditUser(u)} style={{ ...tagBase, background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', cursor: 'pointer' }}>编辑</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
              <table style={{ width: '100%', fontSize: '13px', minWidth: '480px', borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: 'var(--text-secondary)', borderBottom: 'var(--border-width) solid var(--admin-border)' }}>
                  <th style={thStyle}>Email</th><th style={thStyle}>Tier</th><th style={thStyle}>Brands</th><th style={thStyle}>Status</th><th style={thStyle}>Updated</th><th style={thStyle}>Actions</th>
                </tr></thead>
                <tbody>
                  {data.map(u => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{maskEmail(u.email, u.role === 'admin')}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ ...tagBase, background: u.membershipTier === 'free' ? 'var(--bg-hover)' : 'var(--brand-soft)', color: u.membershipTier === 'free' ? 'var(--text-secondary)' : 'var(--brand)' }}>{tierLabel(u.membershipTier)}</span>
                          {u.role === 'admin' && <span style={{ ...tagBase, background: 'var(--admin-badge)', color: 'var(--text-inverse)' }}>Admin</span>}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{(u.configuredBrands || []).join(', ') || '—'}</td>
                      <td style={tdStyle}><span style={{ fontSize: '13px', color: u.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>{statusLabel(u.status)}</span></td>
                      <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                      <td style={tdStyle}><button onClick={() => setEditUser(u)} style={{ ...tagBase, background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', cursor: 'pointer' }}>编辑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Carrier Table */}
      {isCarriers && (
        <div style={{ overflowX: 'auto', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
          {!loading && data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>暂无承运商数据</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>点击"+ 新增承运商"添加运费模板</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '13px', minWidth: '600px', borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: 'var(--text-secondary)', borderBottom: 'var(--border-width) solid var(--admin-border)' }}>
                <th style={thStyle}>Name</th><th style={thStyle}>First Wt</th><th style={thStyle}>First Cost</th><th style={thStyle}>Add. Wt</th><th style={thStyle}>Add. Cost</th><th style={thStyle}>Vol Div</th><th style={thStyle}>Status</th><th style={thStyle}>Updated</th><th style={thStyle}>Actions</th>
              </tr></thead>
              <tbody>
                {data.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{c.name}</td>
                    <td style={tdStyle}>{c.firstWeight}</td>
                    <td style={tdStyle}>¥{c.firstCost}</td>
                    <td style={tdStyle}>{c.additionalWeight}</td>
                    <td style={tdStyle}>¥{c.additionalCost}</td>
                    <td style={tdStyle}>{c.volumeDivisor}</td>
                    <td style={tdStyle}><span style={{ ...tagBase, background: c.isActive === 'active' ? 'var(--brand-soft)' : 'var(--bg-hover)', color: c.isActive === 'active' ? 'var(--success)' : 'var(--danger)' }}>{c.isActive === 'active' ? 'Active' : 'Disabled'}</span></td>
                    <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button onClick={() => setEditCarrier(c)} style={{ ...tagBase, background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', cursor: 'pointer' }}>编辑</button>
                      <button onClick={() => {
                        setConfirmModal({
                          show: true, title: '确认删除', danger: true, confirmLabel: '删除',
                          message: `Delete carrier "${c.name}"?`,
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
                      }} style={{ ...tagBase, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer', marginLeft: '8px' }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Product Table / Cards */}
      {isProducts && (() => {
        if (!loading && data.length === 0) return (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>暂无商品数据</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{!search && !brandFilter && !statusFilter && !quickFilter ? '手动添加或通过 Excel 导入' : '当前筛选条件下无匹配商品'}</p>
          </div>
        )
        if (isMobile) return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedIds.size > 0 && (
              <button onClick={() => setConfirmModal({
                show: true, title: '批量删除', danger: true, confirmLabel: '删除',
                message: `确定删除选中的 ${selectedIds.size} 个商品？此操作不可撤销。`,
                onConfirm: () => {
                  setConfirmModal(null)
                  setBatchLoading(true)
                  apiPost('/api/admin/products/batch-delete', { ids: [...selectedIds] })
                    .then(r => r.json()).then(d => {
                      if (d.success) { setSelectedIds(new Set()); fetchData(page); toast(`已删除 ${d.data.count} 个商品`, 'success') }
                      else toast(d.error?.message || '删除失败', 'error')
                    }).catch(() => toast('网络错误', 'error')).finally(() => setBatchLoading(false))
                }
              })} style={{ background: 'var(--danger)', color: 'var(--text-inverse)', border: 'none', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>删除选中 ({selectedIds.size})</button>
            )}
            {data.map(p => (
              <div key={p.id} style={{ background: 'var(--admin-bg-card)', border: 'var(--border-width) solid var(--admin-border)', padding: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }} />
                  <img
                    src={p.imageUrl || getPlaceholderUrl(p.brand || '?', 64, 64)}
                    alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', flexShrink: 0, background: 'var(--bg-hover)' }}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = getPlaceholderUrl('N/A', 64, 64) }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
                      <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{p.brand}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatPrice(p.currency, p.price)}</span>
                      <span style={{ opacity: 0.6 }}>{p.source}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ ...tagBase, background: p.status === 'active' ? 'var(--brand-soft)' : 'var(--bg-hover)', color: p.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>{statusLabel(p.status)}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditProduct(p)} style={{ ...tagBase, background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', cursor: 'pointer' }}>编辑</button>
                    <button onClick={() => setConfirmModal({
                      show: true, title: '确认删除', danger: true, confirmLabel: '删除',
                      message: `删除商品 "${p.title}"？`,
                      onConfirm: () => {
                        setConfirmModal(null)
                        apiDelete('/api/admin/products', { id: p.id })
                          .then(r => r.json()).then(d => {
                            if (d.success) { fetchData(page); toast('已删除', 'success') }
                            else toast(d.error?.message || '删除失败', 'error')
                          }).catch(() => toast('网络错误', 'error'))
                      }
                    })} style={{ ...tagBase, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer' }}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
        return (
        <div style={{ overflowX: 'auto', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
          <table style={{ width: '100%', fontSize: '13px', minWidth: '700px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: 'var(--text-secondary)', borderBottom: 'var(--border-width) solid var(--admin-border)' }}>
              <th style={{ ...thStyle, width: '32px' }}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ width: '14px', height: '14px', accentColor: 'var(--brand)', cursor: 'pointer' }} /></th>
              <th style={{ ...thStyle, width: '40px' }}></th>
              <th style={thStyle}>Title</th><th style={thStyle}>Brand</th><th style={thStyle}>Price</th><th style={thStyle}>Source</th><th style={thStyle}>Status</th><th style={thStyle}>Updated</th><th style={thStyle}>Actions</th>
            </tr></thead>
          <tbody>
            {data.map(p => (
              <tr key={p.id}>
                <td style={tdStyle}><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ width: '14px', height: '14px', accentColor: 'var(--brand)', cursor: 'pointer' }} /></td>
                <td style={tdStyle}>
                  <img
                    src={p.imageUrl || getPlaceholderUrl(p.brand || '?', 64, 64)}
                    alt=""
                    style={{ width: '32px', height: '32px', objectFit: 'cover', background: 'var(--bg-hover)' }}
                    loading="lazy"
                    onError={e => {
                      const el = e.target as HTMLImageElement
                      el.src = getPlaceholderUrl('N/A', 64, 64)
                    }}
                  />
                </td>
                <td style={{ ...tdStyle, maxWidth: '192px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                <td style={{ ...tdStyle, color: 'var(--brand)' }}>{p.brand}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(p.currency, p.price)}</td>
                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{p.source}</td>
                <td style={tdStyle}><span style={{ ...tagBase, background: p.status === 'active' ? 'var(--brand-soft)' : 'var(--bg-hover)', color: p.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>{statusLabel(p.status)}</span></td>
                <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <button onClick={() => setEditProduct(p)} style={{ ...tagBase, background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', cursor: 'pointer' }}>编辑</button>
                  <button onClick={() => {
                    setConfirmModal({
                      show: true, title: '确认删除', danger: true, confirmLabel: '删除',
                      message: `删除商品 "${p.title}"？`,
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
                  }} style={{ ...tagBase, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer', marginLeft: '8px' }}>删除</button>
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
        <div style={{
          position: 'fixed', bottom: '16px', left: '8px', right: '8px', zIndex: 40,
          background: 'var(--admin-bg-sidebar)', border: 'var(--border-width) solid var(--admin-border)',
          padding: '10px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-inverse)' }}>已选 <b>{selectedIds.size}</b> 项</span>
          <button onClick={handleBatchDelete} disabled={batchLoading} style={{ ...tagBase, background: 'var(--danger)', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer', opacity: batchLoading ? 0.4 : 1 }}>
            批量删除
          </button>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('status', v); e.target.value = '' } }}
            disabled={batchLoading}
            style={{ background: 'var(--bg-input)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '14px', color: 'var(--text-primary)', opacity: batchLoading ? 0.4 : 1 }}
          >
            <option value="" disabled>修改状态</option>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
          <select
            defaultValue=""
            onChange={e => { const v = e.target.value; if (v) { handleBatchUpdate('brand', v); e.target.value = '' } }}
            disabled={batchLoading}
            style={{ background: 'var(--bg-input)', border: 'var(--border-width) solid var(--border-default)', padding: '4px 8px', fontSize: '14px', color: 'var(--text-primary)', opacity: batchLoading ? 0.4 : 1 }}
          >
            <option value="" disabled>修改品牌</option>
            {BRANDS.filter(b => typeof b === 'string').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button onClick={() => setSelectedIds(new Set())} disabled={batchLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-inverse)', opacity: batchLoading ? 0.4 : 0.7 }}>
            取消全选
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

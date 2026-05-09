interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,38,34,0.7)', padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '24px', width: '100%', maxWidth: '360px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={onCancel} style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--text-primary)' }}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
              background: danger ? 'var(--danger)' : 'var(--bg-active)',
              color: 'var(--text-inverse)',
              border: 'none',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, message, confirmLabel = '确认', danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-[var(--bg-hover)] py-2 rounded-lg text-sm">取消</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${danger ? 'bg-[var(--danger)] text-white active:bg-[var(--danger)]/80' : 'bg-[var(--brand)] active:bg-[var(--brand-hover)]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

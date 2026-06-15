import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const STYLES = {
  success: { border: '#a855f7', color: '#c084fc', bg: 'rgba(168,85,247,0.08)', Icon: CheckCircle2 },
  error:   { border: '#ef4444', color: '#f87171', bg: 'rgba(239,68,68,0.08)',   Icon: AlertCircle   },
  info:    { border: '#22d3ee', color: '#67e8f9', bg: 'rgba(34,211,238,0.08)', Icon: Info           },
}

function ToastItem({ toast, onRemove }) {
  const { border, color, bg, Icon } = STYLES[toast.type] ?? STYLES.success
  return (
    <div
      className="flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-2xl backdrop-blur-xl max-w-sm w-full animate-slide-up"
      style={{
        background: bg,
        border: `1px solid ${border}44`,
        boxShadow: `0 8px 32px ${border}22`,
      }}
    >
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <p className="text-sm font-semibold text-white flex-1 leading-tight">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg text-white/30 hover:text-white transition-colors"
        aria-label="Tutup"
      >
        <X size={14} />
      </button>
    </div>
  )
}

/** Render portal-like toast container di sudut kanan bawah layar. */
export default function Toast({ toasts = [], removeToast }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

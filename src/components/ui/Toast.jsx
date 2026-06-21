import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const STYLES = {
  success: { border: '#7c3aed', color: '#a78bfa', bg: 'rgba(124, 58, 237, 0.08)', Icon: CheckCircle2 },
  error:   { border: '#ef4444', color: '#f87171', bg: 'rgba(239, 68, 68, 0.08)',   Icon: AlertCircle   },
  info:    { border: '#71717a', color: '#a1a1aa', bg: 'rgba(113, 113, 122, 0.08)', Icon: Info           },
}

function ToastItem({ toast, onRemove }) {
  const { border, color, bg, Icon } = STYLES[toast.type] ?? STYLES.success
  return (
    <div
      className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg backdrop-blur-xl max-w-sm w-full animate-slide-up bg-zinc-900 border border-zinc-800"
      style={{
        background: bg,
        borderColor: `${border}33`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
      }}
    >
      <Icon size={15} style={{ color, flexShrink: 0 }} />
      <p className="text-xs font-semibold text-zinc-100 flex-1 leading-tight">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

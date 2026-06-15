const BADGE = {
  success:  { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)',  color: '#4ade80', dot: '#22c55e', label: 'Sukses'        },
  pending:  { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.30)',  color: '#fbbf24', dot: '#eab308', label: 'Pending'        },
  failed:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)',  color: '#f87171', dot: '#ef4444', label: 'Gagal'          },
  expired:  { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.30)', color: '#9ca3af', dot: '#6b7280', label: 'Kedaluwarsa'  },
}

export default function StatusBadge({ status }) {
  const s = BADGE[status] ?? BADGE.pending
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
      />
      {s.label}
    </span>
  )
}

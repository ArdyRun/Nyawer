import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, BarChart3, Settings, Copy, ExternalLink, RefreshCw,
  TrendingUp, Users, DollarSign, Monitor, LogOut, Play, CheckCircle2,
  Bell, FileText, Smartphone, HelpCircle, AlertTriangle, Check, X, Loader2,
  Trophy, Target, Sparkles, Wallet
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/ui/Toast'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { MOCK_PROFILE, MOCK_DONATIONS, MOCK_WITHDRAWALS } from '../lib/mockData'
import { formatRp, formatDate, formatDateShort } from '../lib/utils'

/* ── Shared styles (Refined Shape and Color Locks) ─────────── */
const INPUT = 'w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-zinc-900 transition-colors'
const LABEL = 'block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5'

/* ════════════════════════════════════════════════════════════
   STATS TAB
════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10
const DATE_PRESETS = [
  { label: 'Hari Ini',  days: 0 },
  { label: '7 Hari',    days: 7 },
  { label: '30 Hari',   days: 30 },
  { label: 'Semua',     days: null },
]
const STATUS_FILTERS = ['semua', 'success', 'pending', 'failed']
const STATUS_LABELS = { semua: 'Semua', success: 'Sukses', pending: 'Pending', failed: 'Gagal' }

function StatsTab({ profile, donations, onRefresh }) {
  const { toasts, addToast, removeToast } = useToast()
  const [datePreset, setDatePreset]     = useState(null) // null = Semua
  const [statusFilter, setStatusFilter] = useState('semua')
  const [search, setSearch]             = useState('')
  const [hideTest, setHideTest]         = useState(true)
  const [page, setPage]                 = useState(1)

  // ── Filter logic ──────────────────────────────────────────
  const filtered = donations.filter((d) => {
    if (hideTest && d.is_test) return false
    if (statusFilter !== 'semua' && d.status !== statusFilter) return false
    if (search && !d.sender_name.toLowerCase().includes(search.toLowerCase())) return false
    if (datePreset !== null) {
      const now = new Date()
      const start = new Date()
      start.setDate(now.getDate() - datePreset)
      start.setHours(0, 0, 0, 0)
      if (new Date(d.created_at) < start) return false
    }
    return true
  })

  const successFiltered = filtered.filter((d) => d.status === 'success')
  const totalGross      = successFiltered.reduce((s, d) => s + d.amount, 0)
  const totalReceived   = successFiltered.reduce((s, d) => s + (d.amount_received ?? Math.floor(d.amount * 0.96)), 0)
  const payUrl          = `${window.location.origin}/pay/${profile.username}`

  // ── Pagination ────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset page when filters change
  const resetPage = () => setPage(1)

  const copy = (text, label) =>
    navigator.clipboard.writeText(text).then(() => addToast({ message: `${label} disalin!` }))

  const statCards = [
    { label: 'Total Donasi Masuk', value: formatRp(totalGross),          sub: `${successFiltered.length} transaksi sukses`, icon: DollarSign },
    { label: 'Pendapatan Bersih',  value: formatRp(totalReceived),       sub: 'Setelah potongan 4%',                        icon: TrendingUp },
    { label: 'Total Donatur',      value: String(successFiltered.length), sub: 'Sesuai filter aktif',                        icon: Users },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">
          Halo, {profile.display_name}
        </h1>
        <p className="text-zinc-500 text-xs">Ringkasan aktivitas donasi Anda.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="glass-card p-5 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-zinc-800 text-violet-400">
                <Icon size={18} />
              </div>
              <div>
                <p className={LABEL}>{label}</p>
                <p className="font-display font-bold text-xl text-zinc-100 leading-tight">{value}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pay URL */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Link Donasi Publik</span>
          <div className="flex gap-1.5">
            <button onClick={() => copy(payUrl, 'URL')} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="Salin URL"><Copy size={13} /></button>
            <a href={payUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="Buka Link"><ExternalLink size={13} /></a>
          </div>
        </div>
        <code className="text-xs text-violet-400 bg-zinc-900 rounded-lg px-3 py-2 block truncate border border-zinc-800/60 font-mono">{payUrl}</code>
        <p className="text-[10px] text-zinc-600 mt-1.5">Bagikan ke penonton di chat, bio, atau sosmed.</p>
      </div>

      {/* Donation table + filters */}
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/40 bg-zinc-900/10">
          <h3 className="font-display font-bold text-sm text-zinc-100">
            Donasi <span className="text-zinc-500 font-normal">({filtered.length})</span>
          </h3>
          <button onClick={onRefresh} className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-zinc-800/40 bg-zinc-900/5 flex flex-col gap-3">
          {/* Row 1: Search + Hide test */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPage() }}
                placeholder="Cari nama pengirim..."
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold cursor-pointer select-none">
              <input type="checkbox" checked={hideTest} onChange={(e) => { setHideTest(e.target.checked); resetPage() }}
                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-0" />
              Sembunyikan test
            </label>
          </div>
          {/* Row 2: Date presets + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {DATE_PRESETS.map(({ label, days }) => (
                <button key={label} onClick={() => { setDatePreset(days); resetPage() }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    datePreset === days ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300' : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex gap-1">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); resetPage() }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    statusFilter === s ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300' : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800/40 bg-zinc-900/20">
                {['Pengirim', 'Nominal', 'Diterima', 'Pesan', 'Status', 'Waktu'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/30">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-zinc-500">
                    {donations.length === 0 ? 'Belum ada donasi.' : 'Tidak ada donasi yang cocok dengan filter.'}
                  </td>
                </tr>
              ) : paged.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-zinc-100">
                    {d.sender_name}
                    {d.is_test && <span className="ml-2 text-[9px] text-amber-400 bg-amber-950/20 border border-amber-800/30 rounded-full px-1.5 py-0.5 font-bold">TEST</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-300 font-mono">{formatRp(d.amount)}</td>
                  <td className="px-5 py-3 text-xs text-violet-400 font-mono">{formatRp(d.amount_received ?? Math.floor(d.amount * 0.96))}</td>
                  <td className="px-5 py-3 text-xs text-zinc-500 max-w-[140px] truncate">{d.message || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-[10px] text-zinc-600 whitespace-nowrap">{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/40 bg-zinc-900/5">
            <p className="text-[10px] text-zinc-500">
              Halaman {safePage} dari {totalPages}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SETTINGS TAB
════════════════════════════════════════════════════════════ */
function SettingsTab({ profile, onProfileUpdate, sessionToken }) {
  const [form, setForm] = useState({
    display_name:     profile.display_name,
    username:         profile.username,
    bio:              profile.bio ?? '',
    min_donation:     profile.min_donation,
    avatar_url:       profile.avatar_url ?? '',
    cost_per_second:  profile.cost_per_second ?? 0,
    media_max_duration: profile.media_max_duration ?? 30,
    alert_duration:   profile.alert_duration ?? 8,
  })
  const [saving, setSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const debounceRef = useRef(null)
  const { toasts, addToast, removeToast } = useToast()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran (maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast({ message: 'Ukuran file maksimal adalah 2MB.', type: 'error' })
      return
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Hanya file gambar yang diperbolehkan.', type: 'error' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Gagal mengunggah berkas')
      const result = await response.json()

      if (result.success && result.url) {
        set('avatar_url', result.url)
        addToast({ message: 'Foto berhasil diunggah!' })
      } else {
        throw new Error('Respons tidak valid')
      }
    } catch (err) {
      console.error(err)
      addToast({ message: 'Gagal mengunggah foto profil.', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  // ── Username availability check (debounced) ─────────────
  const checkUsername = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean.length < 3 || clean === profile.username) {
      setUsernameStatus(null)
      return
    }
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      if (!isSupabaseReady || !supabase) {
        // Demo mode: simulate check
        setUsernameStatus(clean === profile.username ? null : 'available')
        return
      }
      try {
        const { data } = await supabase.rpc('check_username_available', { p_username: clean })
        if (data?.success) {
          setUsernameStatus(data.available ? 'available' : 'taken')
        }
      } catch {
        setUsernameStatus(null)
      }
    }, 400)
  }, [profile.username])

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    set('username', val)
    checkUsername(val)
  }

  // ── Profile save ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    const dn = form.display_name.trim()
    const un = form.username.trim()
    if (!dn || dn.length > 50) {
      addToast({ message: 'Nama tampil harus 1-50 karakter.', type: 'error' }); return
    }
    if (!un || un.length < 3 || un.length > 30 || !/^[a-z][a-z0-9_]*$/.test(un)) {
      addToast({ message: 'Username harus 3-30 karakter, huruf kecil, angka, atau underscore.', type: 'error' }); return
    }
    if (form.bio.length > 280) {
      addToast({ message: 'Bio maksimal 280 karakter.', type: 'error' }); return
    }
    if (Number(form.min_donation) < 1000) {
      addToast({ message: 'Minimum donasi Rp 1.000.', type: 'error' }); return
    }
    if (usernameStatus === 'taken') {
      addToast({ message: 'Username sudah digunakan.', type: 'error' }); return
    }

    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('update_profile_secure', {
          p_session_token: sessionToken,
          p_display_name: form.display_name,
          p_username: form.username,
          p_bio: form.bio,
          p_min_donation: Number(form.min_donation),
          p_avatar_url: form.avatar_url || null,
          p_cost_per_second: Number(form.cost_per_second),
          p_media_max_duration: Number(form.media_max_duration),
          p_alert_duration: Number(form.alert_duration),
        })
        if (error) throw error
        if (data && !data.success) {
          throw new Error(data.message)
        }
      } else {
        await new Promise((r) => setTimeout(r, 1100))
      }
      onProfileUpdate?.(form)
      addToast({ message: 'Profil berhasil disimpan!' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal menyimpan.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">Pengaturan Profil</h1>
        <p className="text-zinc-500 text-xs">Ubah nama, username, bio, dan minimum donasi.</p>
      </div>

      {/* ── Profile Form ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-5">
        {/* Avatar + Upload */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-lg overflow-hidden group cursor-pointer flex-shrink-0"
            title="Klik untuk ubah foto profil"
          >
            <Avatar src={form.avatar_url} name={form.display_name} size={56} />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mb-0.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[8px] text-zinc-300 font-semibold uppercase tracking-wider">Ubah</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-violet-400" />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-zinc-100 text-sm">{form.display_name || 'Display Name'}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-semibold"
              >
                Pilih File
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">nyawer.id/{form.username}</p>
          </div>
        </div>

        <div className="divider-neon" />

        <div>
          <label className={LABEL}>Nama Tampil</label>
          <input id="setting-display-name" type="text" value={form.display_name} required maxLength={50}
            onChange={(e) => set('display_name', e.target.value)} placeholder="Nama tampil publik" className={INPUT} />
        </div>

        <div>
          <label className={LABEL}>Username (URL Publik)</label>
          <div className="flex">
            <span className="flex items-center px-3.5 bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-lg text-xs text-zinc-500 select-none whitespace-nowrap">nyawer.id/</span>
            <input id="setting-username" type="text" value={form.username} required maxLength={30}
              onChange={handleUsernameChange}
              placeholder="usernamekamu" className={`${INPUT} rounded-l-none border-l-0`} />
          </div>
          {/* Username availability indicator */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {usernameStatus === 'checking' && (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Memeriksa...
              </span>
            )}
            {usernameStatus === 'available' && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check size={10} /> Tersedia
              </span>
            )}
            {usernameStatus === 'taken' && (
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <X size={10} /> Sudah digunakan
              </span>
            )}
            {usernameStatus === null && (
              <p className="text-[10px] text-zinc-600">Huruf kecil, angka, dan underscore. Min. 3 karakter.</p>
            )}
          </div>
        </div>

        <div>
          <label className={LABEL}>Bio <span className="normal-case text-zinc-600 ml-1">({form.bio.length}/280)</span></label>
          <textarea id="setting-bio" value={form.bio} maxLength={280} rows={3}
            onChange={(e) => set('bio', e.target.value)} placeholder="Jadwal stream, game favorit, dll..."
            className={`${INPUT} resize-none`} />
        </div>

        <div>
          <label className={LABEL}>Minimum Donasi</label>
          <div className="flex gap-2 mb-2.5 flex-wrap">
            {[5000, 10000, 25000, 50000].map((v) => (
              <button key={v} type="button" onClick={() => set('min_donation', v)}
                className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold transition-all ${form.min_donation === v ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300' : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300'}`}>
                {formatRp(v)}
              </button>
            ))}
          </div>
          <input id="setting-min-donation" type="number" value={form.min_donation} min={1000} step={1000}
            onChange={(e) => set('min_donation', Math.max(1000, Number(e.target.value)))} className={INPUT} />
        </div>

        <div className="divider-neon" />

        {/* ── Media & Alert Settings ──────────────────────── */}
        <div>
          <h3 className="font-display font-bold text-sm text-zinc-100 mb-0.5">Media & Alert</h3>
          <p className="text-[10px] text-zinc-500 mb-3">Atur video clip dan alert overlay untuk donasi.</p>

          <div className="flex flex-col gap-4">
            {/* Biaya per detik */}
            <div>
              <label className={LABEL}>Biaya per Detik (Rp/detik)</label>
              <p className="text-[10px] text-zinc-600 mb-1.5">0 = fitur video clip nonaktif</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {[100, 200, 500, 1000].map((v) => (
                  <button key={v} type="button" onClick={() => set('cost_per_second', v)}
                    className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-xs font-semibold transition-all ${form.cost_per_second === v ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300' : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300'}`}>
                    Rp {v}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
                <input id="setting-cost-per-second" type="number" value={form.cost_per_second} min={0} step={50}
                  onChange={(e) => set('cost_per_second', Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>

            {/* Durasi maks clip */}
            <div>
              <label className={LABEL}>Durasi Maks Video Clip (detik)</label>
              <div className="relative">
                <input id="setting-media-max-duration" type="number" value={form.media_max_duration} min={5} max={120} step={1}
                  onChange={(e) => set('media_max_duration', Math.min(120, Math.max(5, Number(e.target.value))))}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">detik</span>
              </div>
            </div>

            {/* Durasi alert overlay */}
            <div>
              <label className={LABEL}>Durasi Alert Overlay (detik)</label>
              <div className="relative">
                <input id="setting-alert-duration" type="number" value={form.alert_duration} min={3} max={30} step={1}
                  onChange={(e) => set('alert_duration', Math.min(30, Math.max(3, Number(e.target.value))))}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">detik</span>
              </div>
            </div>

            {/* Info perhitungan */}
            {form.cost_per_second > 0 && (
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-3 py-2.5 text-[10px] text-zinc-500">
                Contoh: <strong className="text-zinc-400">{formatRp(form.cost_per_second)}</strong> ×{' '}
                <strong className="text-zinc-400">{form.media_max_duration} detik</strong> ={' '}
                <strong className="text-violet-400">{formatRp(form.cost_per_second * form.media_max_duration)}</strong> minimum untuk lampirkan video.
              </div>
            )}
          </div>
        </div>

        <button id="setting-submit" type="submit" disabled={saving}
          className={`btn-neon w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mt-2 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {saving ? (
            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : null}
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </form>

      {/* ── Change Password ──────────────────────────────── */}
      <ChangePasswordSection sessionToken={sessionToken} />

      {/* ── Delete Account ───────────────────────────────── */}
      <DeleteAccountSection sessionToken={sessionToken} />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}


/* ── Change Password Sub-Section ────────────────────────── */
function ChangePasswordSection({ sessionToken }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPw.length < 6) {
      addToast({ message: 'Password baru minimal 6 karakter.', type: 'error' }); return
    }
    if (form.newPw !== form.confirm) {
      addToast({ message: 'Konfirmasi password tidak cocok.', type: 'error' }); return
    }
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('change_password', {
          p_session_token: sessionToken,
          p_current_password: form.current,
          p_new_password: form.newPw,
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 800))
      }
      addToast({ message: 'Password berhasil diubah!' })
      setForm({ current: '', newPw: '', confirm: '' })
      setOpen(false)
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal mengubah password.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card mt-4 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/30 transition-colors">
        <div>
          <p className="text-xs font-bold text-zinc-200">Ubah Password</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Perbarui password akun kamu.</p>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-4 border-t border-zinc-800/40">
          <div className="pt-4">
            <label className={LABEL}>Password Saat Ini</label>
            <input id="setting-current-password" type="password" value={form.current} required
              onChange={(e) => set('current', e.target.value)} placeholder="••••••••" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Password Baru</label>
            <input id="setting-new-password" type="password" value={form.newPw} required minLength={6}
              onChange={(e) => set('newPw', e.target.value)} placeholder="Minimal 6 karakter" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Konfirmasi Password Baru</label>
            <input id="setting-confirm-password" type="password" value={form.confirm} required minLength={6}
              onChange={(e) => set('confirm', e.target.value)} placeholder="Ulangi password baru" className={INPUT} />
          </div>
          <button id="setting-change-pw-btn" type="submit" disabled={saving}
            className={`w-full py-2 rounded-lg text-xs font-semibold btn-glass flex items-center justify-center gap-2 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>{saving ? 'Menyimpan...' : 'Ubah Password'}</span>
          </button>
        </form>
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}


/* ── Delete Account Sub-Section ─────────────────────────── */
function DeleteAccountSection({ sessionToken }) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [saving, setSaving] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()

  const handleDelete = async () => {
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('delete_account', {
          p_session_token: sessionToken,
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 800))
      }
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal menghapus akun.', type: 'error' })
      setSaving(false)
    }
  }

  return (
    <div className="glass-card mt-4 overflow-hidden border-red-900/30">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-red-950/10 transition-colors">
        <div className="flex items-center gap-3">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-400">Hapus Akun</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Hapus akun dan semua data secara permanen.</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-red-900/20">
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mt-4">
            <p className="text-xs text-red-300 font-semibold mb-2">Peringatan: Tindakan ini tidak dapat dibatalkan.</p>
            <ul className="text-[10px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>Semua donasi dan data akan dihapus permanen</li>
              <li>Username kamu akan tersedia untuk orang lain</li>
              <li>Link donasi publik akan berhenti berfungsi</li>
            </ul>
          </div>
          <div className="mt-4">
            <label className={LABEL}>Ketik <strong className="text-red-400">HAPUS</strong> untuk konfirmasi</label>
            <input id="setting-delete-confirm" type="text" value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="HAPUS" className={INPUT} />
          </div>
          <button id="setting-delete-btn" onClick={handleDelete}
            disabled={saving || confirmText !== 'HAPUS'}
            className={`w-full mt-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              confirmText === 'HAPUS'
                ? 'bg-red-950/60 border border-red-800/50 text-red-300 hover:bg-red-950/80'
                : 'bg-zinc-900 border border-zinc-800/40 text-zinc-600 cursor-not-allowed'
            } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={13} />}
            <span>{saving ? 'Menghapus...' : 'Hapus Akun Saya'}</span>
          </button>
        </div>
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

/* ── Peta Tema Lengkap DaisyUI dengan warna HEX untuk Pratinjau ─── */
const OVERLAY_THEMES = {
  default: { label: 'Default (Nyawer Violet)', bg: '#18181b', primary: '#7c3aed', secondary: '#ec4899', accent: '#22d3ee', text: '#fafafa' },
  light: { label: 'Light', bg: '#ffffff', primary: '#422ad5', secondary: '#f43098', accent: '#00d3bb', text: '#18181b' },
  dark: { label: 'Dark', bg: '#1d232a', primary: '#605dff', secondary: '#f43098', accent: '#00d3bb', text: '#ecf9ff' },
  cupcake: { label: 'Cupcake', bg: '#faf7f5', primary: '#44ebd3', secondary: '#f9cbe5', accent: '#ffd6a7', text: '#291334' },
  bumblebee: { label: 'Bumblebee', bg: '#ffffff', primary: '#fdc700', secondary: '#ff8904', accent: '#000000', text: '#161616' },
  emerald: { label: 'Emerald', bg: '#ffffff', primary: '#66cc8a', secondary: '#377cfb', accent: '#f68067', text: '#333c4d' },
  corporate: { label: 'Corporate', bg: '#ffffff', primary: '#0082ce', secondary: '#61738d', accent: '#009689', text: '#181a2a' },
  synthwave: { label: 'Synthwave', bg: '#09002f', primary: '#f861b4', secondary: '#71d1fe', accent: '#ff8904', text: '#a1b1ff' },
  retro: { label: 'Retro', bg: '#ece3ca', primary: '#ff9fa0', secondary: '#b7f6cd', accent: '#d08700', text: '#793205' },
  cyberpunk: { label: 'Cyberpunk', bg: '#fff248', primary: '#ff6596', secondary: '#00e8ff', accent: '#ce74ff', text: '#000000' },
  valentine: { label: 'Valentine', bg: '#fcf2f8', primary: '#f43098', secondary: '#ab44ff', accent: '#71d1fe', text: '#c5005a' },
  halloween: { label: 'Halloween', bg: '#1b1816', primary: '#ff8f00', secondary: '#7a00c2', accent: '#42aa00', text: '#cdcdcd' },
  garden: { label: 'Garden', bg: '#e9e7e7', primary: '#fe0075', secondary: '#8e4162', accent: '#5c7f67', text: '#100f0f' },
  forest: { label: 'Forest', bg: '#1b1717', primary: '#1fb854', secondary: '#1eb88e', accent: '#1fb8ab', text: '#cac9c9' },
  aqua: { label: 'Aqua', bg: '#1a368b', primary: '#13ecf3', secondary: '#966fb3', accent: '#ffe999', text: '#b8e6fe' },
  lofi: { label: 'Lofi', bg: '#ffffff', primary: '#0d0d0d', secondary: '#1a1919', accent: '#262626', text: '#000000' },
  pastel: { label: 'Pastel', bg: '#ffffff', primary: '#e9d4ff', secondary: '#feccd2', accent: '#a3f2ce', text: '#161616' },
  fantasy: { label: 'Fantasy', bg: '#ffffff', primary: '#6d0076', secondary: '#0075c2', accent: '#ff8600', text: '#1f2937' },
  wireframe: { label: 'Wireframe', bg: '#ffffff', primary: '#d4d4d4', secondary: '#d4d4d4', accent: '#d4d4d4', text: '#161616' },
  black: { label: 'Black', bg: '#000000', primary: '#3a3a3a', secondary: '#3a3a3a', accent: '#3a3a3a', text: '#d6d6d6' },
  luxury: { label: 'Luxury', bg: '#09090b', primary: '#ffffff', secondary: '#152747', accent: '#513448', text: '#dca54d' },
  dracula: { label: 'Dracula', bg: '#282a36', primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c', text: '#f8f8f3' },
  cmyk: { label: 'CMYK', bg: '#ffffff', primary: '#45aeee', secondary: '#e8488a', accent: '#fff234', text: '#161616' },
  autumn: { label: 'Autumn', bg: '#f1f1f1', primary: '#8c0327', secondary: '#d59b6b', accent: '#d59b6b', text: '#141414' },
  business: { label: 'Business', bg: '#202020', primary: '#1c4e80', secondary: '#7c909a', accent: '#ea6947', text: '#cdcdcd' },
  acid: { label: 'Acid', bg: '#fff7ed', primary: '#ff00ff', secondary: '#ff6e00', accent: '#c8ff00', text: '#000000' },
  lemonade: { label: 'Lemonade', bg: '#f8fdef', primary: '#419400', secondary: '#bdc000', accent: '#edd000', text: '#151614' },
  night: { label: 'Night', bg: '#0f172a', primary: '#3abdf7', secondary: '#818cf8', accent: '#f471b5', text: '#c9cbd0' },
  coffee: { label: 'Coffee', bg: '#261b25', primary: '#db924c', secondary: '#273e3f', accent: '#11576d', text: '#c59f61' },
  winter: { label: 'Winter', bg: '#ffffff', primary: '#394e6a', secondary: '#0069ff', accent: '#463aa2', text: '#161616' },
  dim: { label: 'Dim', bg: '#2a303c', primary: '#9fe88d', secondary: '#ff7d5d', accent: '#c792e9', text: '#b2ccd6' },
  nord: { label: 'Nord', bg: '#eceff4', primary: '#5e81ac', secondary: '#81a1c1', accent: '#88c0d0', text: '#2e3440' },
  sunset: { label: 'Sunset', bg: '#121c22', primary: '#ff865b', secondary: '#fd6f9c', accent: '#b387fa', text: '#9fb9d0' },
  abyss: { label: 'Abyss', bg: '#001e29', primary: '#bdff00', secondary: '#cebef4', accent: '#505050', text: '#ffd6a7' },
  silk: { label: 'Silk', bg: '#f7f5f3', primary: '#1c1c29', secondary: '#1c1c29', accent: '#1c1c29', text: '#4b4743' }
}

function isThemeLight(hexColor) {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) return false
  const c = hexColor.substring(1)
  const rgb = parseInt(c, 16)
  if (isNaN(rgb)) return false
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 180
}

/* ════════════════════════════════════════════════════════════
   OVERLAY TAB
════════════════════════════════════════════════════════════ */
function OverlayTab({ profile, user, sessionToken, onProfileUpdate }) {
  const { toasts, addToast, removeToast } = useToast()
  const [testing, setTesting] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowThemeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const base = window.location.origin
  const overlayUrls = [
    {
      id: 'alert',
      icon: Bell,
      label: 'Alert URL',
      url: `${base}/overlay/alert/${profile.id}?theme=${selectedTheme}&alert_duration=${profile.alert_duration ?? 8}`,
      desc: 'Popup donasi real-time. Ukuran: 1920×1080.',
    },
    {
      id: 'marquee',
      icon: FileText,
      label: 'Marquee URL',
      url: `${base}/overlay/marquee/${profile.id}?theme=${selectedTheme}`,
      desc: 'Running text histori donasi. Ukuran: 1920×80.',
    },
    {
      id: 'qr',
      icon: Smartphone,
      label: 'QR Code URL',
      url: `${base}/overlay/qr/${profile.id}?theme=${selectedTheme}`,
      desc: 'QR scan untuk donasi. Ukuran bebas.',
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      label: 'Leaderboard URL',
      url: `${base}/overlay/leaderboard/${profile.id}?theme=${selectedTheme}`,
      desc: 'Top 10 donatur. Ukuran: 300×400.',
    },
    {
      id: 'goal',
      icon: Target,
      label: 'Goal URL',
      url: `${base}/overlay/goal/${profile.id}?theme=${selectedTheme}`,
      desc: 'Progress bar target donasi. Ukuran: 440×100.',
    },
  ]

  const copy = (text, label) =>
    navigator.clipboard.writeText(text).then(() => addToast({ message: `${label} disalin!` }))

  const sendTestAlert = async () => {
    setTesting(true)
    const testDonation = {
      id: Date.now(),
      sender_name: 'Uji Coba',
      amount: 50000,
      message: 'Ini adalah uji coba alert Nyawer!',
      is_test: true,
      status: 'success',
      created_at: new Date().toISOString(),
    }

    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('insert_test_donation', {
          p_session_token: sessionToken,
          p_amount: testDonation.amount,
          p_message: testDonation.message
        })
        if (error) throw error
        if (data && !data.success) {
          throw new Error(data.message)
        }
      } else {
        await new Promise((r) => setTimeout(r, 600))
        localStorage.setItem('nyawer_test_alert', JSON.stringify(testDonation))
      }
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
      addToast({ message: 'Test alert terkirim! Cek OBS Overlay.' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal kirim test.', type: 'error' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">Overlay OBS</h1>
        <p className="text-zinc-500 text-xs">Salin URL di bawah dan tambahkan sebagai Browser Source di OBS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Setelan & URL (60% Lebar) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Theme Selector (Custom Popover with Color Previews) */}
          <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20" ref={dropdownRef}>
            <div>
              <p className="text-xs font-bold text-zinc-200">Tema Warna Overlay</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Pilih skema warna alert & marquee untuk disalin ke OBS.</p>
            </div>

            <div className="relative">
              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 flex items-center justify-between gap-3 hover:text-white hover:border-zinc-700 transition-colors min-w-[200px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="capitalize">{selectedTheme}</span>
                </div>

                {/* Color preview of active theme */}
                <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme]?.bg || '#18181b', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] font-bold text-white" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme]?.primary }}>A</div>
                  <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] font-bold text-white" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme]?.secondary }}>A</div>
                  <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] font-bold text-black" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme]?.accent }}>A</div>
                  <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] font-bold text-black" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme]?.text }}>A</div>
                </div>
              </button>

              {/* Popover Dropdown Panel */}
              {showThemeDropdown && (
                <div className="absolute right-0 mt-2 z-50 w-[280px] bg-zinc-950 border border-zinc-850 p-2 rounded-lg shadow-2xl max-h-[320px] overflow-y-auto flex flex-col gap-1">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1 border-b border-zinc-900 mb-1">Pilih Tema</p>
                  {Object.keys(OVERLAY_THEMES).map((themeKey) => {
                    const theme = OVERLAY_THEMES[themeKey]
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(themeKey)
                          setShowThemeDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-all ${
                          selectedTheme === themeKey
                            ? 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                            : 'hover:bg-zinc-900/50 border border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate capitalize">{themeKey}</span>

                        {/* Color preview blocks */}
                        <div className="flex items-center gap-0.5 rounded p-1 shadow-sm shrink-0 border border-zinc-900/40" style={{ backgroundColor: theme.bg }}>
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: theme.primary }}>A</div>
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: theme.secondary }}>A</div>
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-black" style={{ backgroundColor: theme.accent }}>A</div>
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-black" style={{ backgroundColor: theme.text }}>A</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* OBS instructions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-zinc-400" /> Cara Menambahkan ke OBS
            </p>
            <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Di OBS, klik tombol <strong className="text-zinc-300 font-semibold">+</strong> di panel Sources</li>
              <li>Pilih <strong className="text-zinc-300 font-semibold">Browser</strong> lalu isi URL dari salah satu di bawah</li>
              <li>Atur Width/Height sesuai keterangan masing-masing overlay</li>
              <li>Centang opsi <strong className="text-zinc-300 font-semibold">"Page background color: transparent"</strong></li>
            </ol>
          </div>

          {/* URL boxes */}
          <div className="flex flex-col gap-4">
            {overlayUrls.map(({ id, icon: IconComponent, label, url, desc }) => (
              <div key={id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-zinc-800">
                      <IconComponent size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{label}</p>
                      <p className="text-[10px] text-zinc-500">{desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => copy(url, label)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="Salin URL">
                      <Copy size={13} />
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="Buka di tab baru">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                <code className="text-xs font-mono block truncate rounded-lg px-3 py-2 border bg-zinc-900 border-zinc-800/80 text-violet-400">
                  {url}
                </code>
              </div>
            ))}
          </div>

          {/* Goal Target Setting */}
          <GoalTargetSection profile={profile} sessionToken={sessionToken} onProfileUpdate={onProfileUpdate} />

          {/* Test alert section */}
          <div className="glass-card p-5">
            <h3 className="font-display font-bold text-base text-zinc-100 mb-2 flex items-center gap-2">
              <Play size={15} className="text-violet-400 fill-current" />
              Uji Coba Alert
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Klik tombol untuk mengirim donasi uji coba (Rp 50.000) ke halaman{' '}
              <a href={`${window.location.origin}/overlay/alert/${profile.id}?theme=${selectedTheme}&alert_duration=${profile.alert_duration ?? 8}`} target="_blank" rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                Alert Overlay
              </a>.
              Pastikan halaman tersebut sudah terbuka di tab lain atau OBS.
            </p>

            <button id="overlay-test-btn" onClick={sendTestAlert} disabled={testing || testSent}
              className={`btn-neon px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${(testing || testSent) ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {testSent ? (
                <CheckCircle2 size={14} />
              ) : testing ? (
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Play size={13} className="fill-current" />
              )}
              <span>{testSent ? 'Alert Terkirim!' : testing ? 'Mengirim...' : 'Kirim Uji Coba Alert'}</span>
            </button>

            {!isSupabaseReady && (
              <p className="text-[10px] text-zinc-500 mt-2.5">
                Mode Demo - buka halaman Alert Overlay <strong>di tab yang sama browser ini</strong> agar localStorage event bekerja.
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Live Preview (40% Lebar) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-400" /> Live Preview OBS
            </h3>
            <p className="text-[10px] text-zinc-500 mb-4">Pratinjau tampilan alert & marquee berdasarkan tema terpilih.</p>

            {/* OBS Simulator Screen (Checkerboard Pattern) */}
            <div
              className="relative w-full h-[320px] rounded-lg border border-zinc-800 flex flex-col justify-between overflow-hidden p-4 select-none"
              style={{
                backgroundImage: 'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#09090b',
              }}
            >
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800/60 text-[9px] font-bold text-zinc-500 tracking-wider uppercase">
                OBS Screen (Transparan)
              </div>

              {/* 1. Alert Card Preview */}
              <div className="flex justify-center w-full mt-10">
                <div
                  className="w-full max-w-[280px] rounded-lg border p-3 flex flex-col gap-2 shadow-xl animate-float transition-all duration-300"
                  style={{
                    backgroundColor: OVERLAY_THEMES[selectedTheme].bg,
                    borderColor: selectedTheme === 'default' ? 'rgba(63, 63, 70, 0.4)' : OVERLAY_THEMES[selectedTheme].primary + '4D',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: OVERLAY_THEMES[selectedTheme].primary, flexShrink: 0 }}>
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: OVERLAY_THEMES[selectedTheme].text,
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      BudiGaming
                      <span className="text-zinc-500 font-normal mx-1">mengirim</span>
                      <span style={{ color: OVERLAY_THEMES[selectedTheme].accent, fontWeight: 800 }}>
                        Rp 50.000
                      </span>
                    </span>
                  </div>

                  <div
                    style={{
                      borderLeft: `1.5px solid ${OVERLAY_THEMES[selectedTheme].primary}`,
                      paddingLeft: 8,
                      paddingTop: 1,
                      paddingBottom: 1,
                      color: isThemeLight(OVERLAY_THEMES[selectedTheme].bg) ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)',
                      fontSize: 10,
                      fontStyle: 'italic',
                      lineHeight: 1.3,
                    }}
                  >
                    "Maju terus bang! Mabar Valorant lagi!"
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-[1px] bg-white/5 relative overflow-hidden mt-1">
                    <div className="absolute left-0 top-0 h-full w-[60%] animate-pulse" style={{ backgroundColor: OVERLAY_THEMES[selectedTheme].primary }} />
                  </div>
                </div>
              </div>

              {/* 2. Marquee Bar Preview */}
              <div
                className="w-full h-8 flex items-center px-3 border-t overflow-hidden relative"
                style={{
                  backgroundColor: OVERLAY_THEMES[selectedTheme].bg,
                  borderColor: selectedTheme === 'default' ? 'rgba(63, 63, 70, 0.4)' : OVERLAY_THEMES[selectedTheme].primary + '4D',
                  marginLeft: '-16px',
                  marginRight: '-16px',
                  width: 'calc(100% + 32px)',
                  marginBottom: '-16px',
                }}
              >
                <div
                  className="flex items-center gap-1 py-1 px-2.5 h-full mr-2 z-10 shrink-0"
                  style={{ backgroundColor: OVERLAY_THEMES[selectedTheme].primary }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ color: OVERLAY_THEMES[selectedTheme].bg === '#ffffff' ? '#09090b' : '#ffffff' }}>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider"
                    style={{ color: isThemeLight(OVERLAY_THEMES[selectedTheme].bg) ? '#09090b' : '#ffffff' }}
                  >
                    Nyawer
                  </span>
                </div>

                <div className="flex items-center gap-2 truncate z-10 text-[9px] font-medium leading-none">
                  <span style={{ color: isThemeLight(OVERLAY_THEMES[selectedTheme].bg) ? '#18181b' : OVERLAY_THEMES[selectedTheme].text }}>BudiGaming</span>
                  <span style={{ color: OVERLAY_THEMES[selectedTheme].accent, fontWeight: 700 }}>Rp 50.000</span>
                  <span style={{ color: isThemeLight(OVERLAY_THEMES[selectedTheme].bg) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>"Maju terus bang!"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}


/* ── Goal Target Setting ────────────────────────────────── */
function GoalTargetSection({ profile, sessionToken, onProfileUpdate }) {
  const [target, setTarget]         = useState(profile.donation_target ?? 0)
  const [current, setCurrent]       = useState(profile.donation_goal_current ?? 0)
  const [addAmount, setAddAmount]   = useState('')
  const [saving, setSaving]         = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  // Sync when profile changes externally
  useEffect(() => {
    setTarget(profile.donation_target ?? 0)
    setCurrent(profile.donation_goal_current ?? 0)
  }, [profile.donation_target, profile.donation_goal_current])

  const handleSetTarget = async () => {
    const val = Number(target)
    if (val < 0) {
      addToast({ message: 'Target tidak boleh negatif.', type: 'error' }); return
    }
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('set_donation_target', {
          p_session_token: sessionToken,
          p_target: val,
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 600))
      }
      onProfileUpdate?.({ donation_target: val })
      addToast({ message: 'Target donasi berhasil disimpan!' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal menyimpan target.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleResetCurrent = async () => {
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('reset_donation_goal', {
          p_session_token: sessionToken,
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 400))
      }
      setCurrent(0)
      onProfileUpdate?.({ donation_goal_current: 0 })
      addToast({ message: 'Progress donasi direset ke 0.' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal reset progress.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddManual = async () => {
    const val = Number(addAmount)
    if (!val || val <= 0) {
      addToast({ message: 'Masukkan nominal yang valid.', type: 'error' }); return
    }
    const newCurrent = current + val
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('add_to_goal', {
          p_session_token: sessionToken,
          p_amount: val,
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 400))
      }
      setCurrent(newCurrent)
      setAddAmount('')
      onProfileUpdate?.({ donation_goal_current: newCurrent })
      addToast({ message: `Berhasil menambah ${formatRp(val)} ke goal.` })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal menambah ke goal.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-bold text-base text-zinc-100 mb-1 flex items-center gap-2">
        <Target size={15} className="text-violet-400" />
        Target Donasi
      </h3>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        Atur target dan progress untuk overlay <strong className="text-zinc-300 font-semibold">Goal</strong>.
      </p>

      {/* Current progress preview */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
          <span>Progress saat ini</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all"
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between items-baseline">
          <span className="font-display font-bold text-sm text-zinc-100">{formatRp(current)}</span>
          <span className="text-[10px] text-zinc-500">/ {formatRp(target)}</span>
        </div>
      </div>

      {/* Set target */}
      <div className="mb-3">
        <label className={LABEL}>Target Donasi</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
            <input id="overlay-goal-target" type="number" value={target} min={0} step={10000}
              onChange={(e) => setTarget(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <button id="overlay-goal-set" onClick={handleSetTarget} disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold btn-neon flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            Set Target
          </button>
        </div>
      </div>

      {/* Add manual amount */}
      <div className="mb-3">
        <label className={LABEL}>Tambah Manual <span className="normal-case text-zinc-600 ml-1">(donasi luar platform)</span></label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
            <input id="overlay-goal-add" type="number" value={addAmount} min={1000} step={1000}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Nominal"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <button id="overlay-goal-add-btn" onClick={handleAddManual} disabled={saving || !addAmount}
            className="px-4 py-2 rounded-lg text-xs font-semibold btn-glass flex items-center gap-1.5 disabled:opacity-60">
            Tambah
          </button>
        </div>
      </div>

      {/* Reset current */}
      <div className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800/40 rounded-lg px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold text-zinc-400">Reset Progress</p>
          <p className="text-[10px] text-zinc-600">Atur ulang progress ke 0 (target tetap).</p>
        </div>
        <button id="overlay-goal-reset" onClick={handleResetCurrent} disabled={saving || current === 0}
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          Reset ke 0
        </button>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   WITHDRAWAL TAB
════════════════════════════════════════════════════════════ */
const BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'DANA', 'GoPay', 'OVO']

function WithdrawalTab({ profile, donations, sessionToken }) {
  const [form, setForm] = useState({ amount: '', bank_name: '', bank_account: '', bank_holder: '' })
  const [saving, setSaving] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, addToast, removeToast } = useToast()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Hitung saldo dari data donasi yang sudah di-load
  const successDonations = donations.filter((d) => d.status === 'success' && !d.is_test)
  const totalReceived = successDonations.reduce((s, d) => s + (d.amount_received ?? Math.floor(d.amount * 0.96)), 0)
  const totalWithdrawn = withdrawals.filter((w) => w.status === 'completed')
    .reduce((s, w) => s + w.amount, 0)
  const availableBalance = totalReceived - totalWithdrawn

  // Load withdrawals
  useEffect(() => {
    const load = async () => {
      try {
        if (isSupabaseReady && supabase) {
          const { data, error } = await supabase.rpc('get_my_withdrawals', { p_session_token: sessionToken })
          if (error) throw error
          if (data?.success) setWithdrawals(data.withdrawals || [])
        } else {
          setWithdrawals(MOCK_WITHDRAWALS)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionToken])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)

    if (amount < 50000) {
      addToast({ message: 'Minimal penarikan Rp 50.000.', type: 'error' }); return
    }
    if (amount > availableBalance) {
      addToast({ message: 'Saldo tidak mencukupi.', type: 'error' }); return
    }
    if (!form.bank_name || !form.bank_account.trim() || !form.bank_holder.trim()) {
      addToast({ message: 'Data bank harus diisi lengkap.', type: 'error' }); return
    }

    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('request_withdrawal', {
          p_session_token: sessionToken,
          p_amount: amount,
          p_bank_name: form.bank_name,
          p_bank_account: form.bank_account.trim(),
          p_bank_holder: form.bank_holder.trim(),
        })
        if (error) throw error
        if (data && !data.success) throw new Error(data.message)
      } else {
        await new Promise((r) => setTimeout(r, 1200))
        // Tambah ke mock withdrawals
        const newW = {
          id: 'w' + Date.now(),
          streamer_id: profile.id,
          amount,
          bank_name: form.bank_name,
          bank_account: form.bank_account.trim(),
          bank_holder: form.bank_holder.trim(),
          status: 'completed',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setWithdrawals((prev) => [newW, ...prev])
      }
      setForm({ amount: '', bank_name: '', bank_account: '', bank_holder: '' })
      addToast({ message: 'Penarikan berhasil diajukan!' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal mengajukan penarikan.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">Penarikan Dana</h1>
        <p className="text-zinc-500 text-xs">Tarik saldo dari donasi yang kamu terima.</p>
      </div>

      {/* Saldo Tersedia */}
      <div className="glass-card p-5 mb-5">
        <p className={LABEL}>Saldo Tersedia</p>
        <p className="font-display font-bold text-3xl text-zinc-100 mb-1">{formatRp(availableBalance)}</p>
        <p className="text-[10px] text-zinc-500">
          Dari {formatRp(totalReceived)} diterima{totalWithdrawn > 0 ? ` · ${formatRp(totalWithdrawn)} sudah ditarik` : ''}
        </p>
      </div>

      {/* Form Penarikan */}
      <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4 mb-5">
        <h3 className="font-display font-bold text-sm text-zinc-100">Ajukan Penarikan</h3>

        <div>
          <label className={LABEL}>Nominal Penarikan</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
            <input id="withdraw-amount" type="number" value={form.amount} min={50000} step={1000}
              onChange={(e) => set('amount', Math.max(0, Number(e.target.value)))}
              placeholder={`Min. Rp 50.000 · Max. ${formatRp(availableBalance)}`}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className={LABEL}>Nama Bank / E-Wallet</label>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {BANKS.map((b) => (
              <button key={b} type="button" onClick={() => set('bank_name', b)}
                className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  form.bank_name === b
                    ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300'
                    : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL}>Nomor Rekening / No. HP</label>
          <input id="withdraw-account" type="text" value={form.bank_account} required maxLength={30}
            onChange={(e) => set('bank_account', e.target.value)}
            placeholder="Contoh: 1234567890"
            className={INPUT} />
        </div>

        <div>
          <label className={LABEL}>Atas Nama</label>
          <input id="withdraw-holder" type="text" value={form.bank_holder} required maxLength={50}
            onChange={(e) => set('bank_holder', e.target.value)}
            placeholder="Nama pemilik rekening"
            className={INPUT} />
        </div>

        <button id="withdraw-submit" type="submit" disabled={saving || availableBalance < 50000}
          className={`btn-neon w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mt-1 ${saving || availableBalance < 50000 ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {saving ? (
            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Wallet size={14} />
          )}
          <span>{saving ? 'Mengajukan...' : 'Ajukan Penarikan'}</span>
        </button>

        {availableBalance < 50000 && (
          <p className="text-[10px] text-zinc-500 text-center">Saldo minimal Rp 50.000 untuk melakukan penarikan.</p>
        )}
      </form>

      {/* Riwayat Penarikan */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/40 bg-zinc-900/10">
          <h3 className="font-display font-bold text-sm text-zinc-100">
            Riwayat Penarikan <span className="text-zinc-500 font-normal">({withdrawals.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin mx-auto" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-zinc-500">
            Belum ada riwayat penarikan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-800/40 bg-zinc-900/20">
                  {['Tanggal', 'Nominal', 'Bank', 'Rekening', 'Atas Nama'].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/30">
                {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-5 py-3 text-[10px] text-zinc-400 whitespace-nowrap">{formatDateShort(w.created_at)}</td>
                      <td className="px-5 py-3 text-xs text-zinc-100 font-semibold">{formatRp(w.amount)}</td>
                      <td className="px-5 py-3 text-xs text-zinc-300">{w.bank_name}</td>
                      <td className="px-5 py-3 text-xs text-zinc-400 font-mono">{w.bank_account}</td>
                      <td className="px-5 py-3 text-xs text-zinc-400">{w.bank_holder}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}


/* ════════════════════════════════════════════════════════════
   DASHBOARD ROOT
════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'stats',      label: 'Statistik',           icon: BarChart3 },
  { id: 'settings',   label: 'Pengaturan Profil',   icon: Settings  },
  { id: 'overlay',    label: 'Overlay & Uji Coba',  icon: Monitor   },
  { id: 'withdrawal', label: 'Penarikan',           icon: Wallet    },
]

export default function Dashboard() {
  const [tab, setTab]         = useState('stats')
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, profile, setProfile, sessionToken, signOut } = useAuth()
  const navigate               = useNavigate()

  const fetchDashboardData = useCallback(async () => {
    if (!user || !sessionToken) return

    try {
      if (isSupabaseReady && supabase) {
        const { data: profileRes, error: profileError } = await supabase
          .rpc('get_current_user_profile', { p_session_token: sessionToken })

        if (profileError) throw profileError
        if (profileRes?.success) {
          setProfile(profileRes.profile)
        } else {
          throw new Error(profileRes?.message || 'Gagal memuat profil.')
        }

        const { data: donationsRes, error: donationsError } = await supabase
          .rpc('get_my_donations', { p_session_token: sessionToken })

        if (donationsError) throw donationsError
        if (donationsRes?.success) {
          setDonations(donationsRes.donations || [])
        } else {
          throw new Error(donationsRes?.message || 'Gagal memuat donasi.')
        }
      } else {
        setProfile(MOCK_PROFILE)
        setDonations(MOCK_DONATIONS)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user, sessionToken, setProfile])

  useEffect(() => {
    if (!user) return

    fetchDashboardData()

    if (isSupabaseReady && supabase) {
      const channel = supabase
        .channel(`dashboard-realtime-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'donations',
          filter: `streamer_id=eq.${user.id}`,
        }, (payload) => {
          console.log('Realtime update received:', payload)
          fetchDashboardData()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchDashboardData])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <img src="/mascot-loading.png" alt="Memuat" className="w-14 h-14 object-contain animate-spin" />
        <p className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">Memuat Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* ── Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-zinc-950 border-r border-zinc-900 p-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="Nyawer" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-display font-bold text-base tracking-wider text-zinc-100">
            NYAWER
          </span>
        </Link>

        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2 px-2">Menu</p>

        <nav className="flex flex-col gap-1.5 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                tab === id
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}>
              <Icon size={14} />{label}
            </button>
          ))}

          <div className="divider-neon my-2" />

          <a href={`/pay/${profile.username}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 transition-all">
            <ExternalLink size={14} /> Halaman Donasi
          </a>
        </nav>

        {/* Profile + logout */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar src={profile.avatar_url} name={profile.display_name} size={32} />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">{profile.display_name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email ?? 'demo@nyawer.id'}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all border border-zinc-850 hover:border-red-900/40">
            <LogOut size={12} /> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 min-w-0 p-5 md:p-8 overflow-auto">
        {/* Mobile tab bar */}
        <div className="lg:hidden bg-zinc-900/60 border border-zinc-800/40 p-1 flex gap-1 mb-6 rounded-lg overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                tab === id ? 'bg-zinc-900 text-zinc-200 border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {tab === 'stats'      && <StatsTab profile={profile} donations={donations} onRefresh={fetchDashboardData} />}
        {tab === 'settings'   && <SettingsTab profile={profile} onProfileUpdate={(u) => setProfile((p) => ({ ...p, ...u }))} sessionToken={sessionToken} />}
        {tab === 'overlay'    && <OverlayTab profile={profile} user={user} sessionToken={sessionToken} onProfileUpdate={(u) => setProfile((p) => ({ ...p, ...u }))} />}
        {tab === 'withdrawal' && <WithdrawalTab profile={profile} donations={donations} sessionToken={sessionToken} />}
      </main>
    </div>
  )
}

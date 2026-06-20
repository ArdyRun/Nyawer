import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, BarChart3, Settings, Copy, ExternalLink, RefreshCw,
  TrendingUp, Users, DollarSign, Monitor, LogOut, Play, CheckCircle2,
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/ui/Toast'
import StatusBadge from '../components/ui/StatusBadge'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { MOCK_PROFILE, MOCK_DONATIONS } from '../lib/mockData'
import { formatRp, formatDate } from '../lib/utils'

/* ── Shared styles ─────────────────────────────────────────── */
const INPUT = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.06] transition-all'
const LABEL = 'block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2'

/* ════════════════════════════════════════════════════════════
   STATS TAB
════════════════════════════════════════════════════════════ */
function StatsTab({ profile, donations, onRefresh }) {
  const { toasts, addToast, removeToast } = useToast()

  const successOnly   = donations.filter((d) => d.status === 'success' && !d.is_test)
  const totalGross    = successOnly.reduce((s, d) => s + d.amount, 0)
  const totalReceived = successOnly.reduce((s, d) => s + (d.amount_received ?? Math.floor(d.amount * 0.96)), 0)
  const payUrl        = `${window.location.origin}/pay/${profile.username}`

  const copy = (text, label) =>
    navigator.clipboard.writeText(text).then(() => addToast({ message: `${label} disalin!` }))

  const statCards = [
    { label: 'Total Donasi Masuk', value: formatRp(totalGross),    sub: `${successOnly.length} transaksi sukses`, icon: DollarSign, color: '#a855f7' },
    { label: 'Pendapatan Bersih',  value: formatRp(totalReceived), sub: 'Setelah potongan 4%',                    icon: TrendingUp,  color: '#22d3ee' },
    { label: 'Total Donatur',      value: successOnly.length,       sub: 'Sepanjang waktu',                        icon: Users,       color: '#ec4899' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white mb-1">
          Halo,{' '}
          <span style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {profile.display_name}
          </span>{' '}👋
        </h1>
        <p className="text-white/40 text-sm">Ringkasan aktivitas donasi kamu hari ini.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${color}0a 0%, transparent 70%)` }} />
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className={LABEL}>{label}</p>
                <p className="font-display font-black text-2xl text-white leading-tight">{value}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pay URL */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">💸 Link Donasi Publik</span>
          <div className="flex gap-1.5">
            <button onClick={() => copy(payUrl, 'URL')} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-purple-300 transition-all"><Copy size={13} /></button>
            <a href={payUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-cyan-300 transition-all"><ExternalLink size={13} /></a>
          </div>
        </div>
        <code className="text-xs text-purple-300 bg-purple-500/8 rounded-lg px-3 py-2 block truncate border border-purple-500/10 font-mono">{payUrl}</code>
        <p className="text-[11px] text-white/25 mt-1.5">Bagikan ke penonton di chat, bio, atau sosmed.</p>
      </div>

      {/* Donation table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <h3 className="font-display font-bold text-base text-white">5 Donasi Terakhir</h3>
          <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Pengirim', 'Nominal', 'Diterima', 'Pesan', 'Status', 'Waktu'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-white/25 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donations.slice(0, 5).map((d) => (
                <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-white">
                    {d.sender_name}
                    {d.is_test && <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-1.5 py-0.5">TEST</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-white font-mono">{formatRp(d.amount)}</td>
                  <td className="px-5 py-4 text-sm text-purple-300 font-mono">{formatRp(d.amount_received ?? Math.floor(d.amount * 0.96))}</td>
                  <td className="px-5 py-4 text-sm text-white/40 max-w-[140px] truncate">{d.message || '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-4 text-xs text-white/25 whitespace-nowrap">{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    display_name: profile.display_name,
    username:     profile.username,
    bio:          profile.bio ?? '',
    min_donation: profile.min_donation,
  })
  const [saving, setSaving] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase.rpc('update_profile_secure', {
          p_session_token: sessionToken,
          p_display_name: form.display_name,
          p_username: form.username,
          p_bio: form.bio,
          p_min_donation: Number(form.min_donation)
        })
        if (error) throw error
        if (data && !data.success) {
          throw new Error(data.message)
        }
      } else {
        await new Promise((r) => setTimeout(r, 1100))
      }
      onProfileUpdate?.(form)
      addToast({ message: '✓ Profil berhasil disimpan!' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal menyimpan.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white mb-1">Pengaturan Profil</h1>
        <p className="text-white/40 text-sm">Ubah nama, username, bio, dan minimum donasi.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center font-display font-black text-3xl text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#22d3ee)' }}>
            {(form.display_name?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{form.display_name || 'Display Name'}</p>
            <p className="text-sm text-white/40 mt-0.5">nyawer.id/{form.username}</p>
          </div>
        </div>
        <div className="divider-neon" />

        <div><label className={LABEL}>Nama Tampil</label>
          <input id="setting-display-name" type="text" value={form.display_name} required maxLength={50}
            onChange={(e) => set('display_name', e.target.value)} placeholder="Nama tampil publik" className={INPUT} /></div>

        <div><label className={LABEL}>Username (URL Publik)</label>
          <div className="flex">
            <span className="flex items-center px-4 bg-white/[0.03] border border-r-0 border-white/10 rounded-l-xl text-sm text-white/30 select-none whitespace-nowrap">nyawer.id/</span>
            <input id="setting-username" type="text" value={form.username} required maxLength={30}
              onChange={(e) => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="usernamekamu" className={`${INPUT} rounded-l-none border-l-0`} />
          </div>
          <p className="text-[11px] text-white/25 mt-1.5">Hanya huruf kecil, angka, dan underscore.</p>
        </div>

        <div><label className={LABEL}>Bio <span className="normal-case text-white/20 ml-1">({form.bio.length}/280)</span></label>
          <textarea id="setting-bio" value={form.bio} maxLength={280} rows={3}
            onChange={(e) => set('bio', e.target.value)} placeholder="Jadwal stream, game favorit, dll..."
            className={`${INPUT} resize-none`} /></div>

        <div><label className={LABEL}>Minimum Donasi</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {[5000, 10000, 25000, 50000].map((v) => (
              <button key={v} type="button" onClick={() => set('min_donation', v)}
                className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-bold transition-all ${form.min_donation === v ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300' : 'glass-card border border-white/[0.06] text-white/35 hover:text-white'}`}>
                {formatRp(v)}
              </button>
            ))}
          </div>
          <input id="setting-min-donation" type="number" value={form.min_donation} min={1000} step={1000}
            onChange={(e) => set('min_donation', Math.max(1000, Number(e.target.value)))} className={INPUT} />
        </div>

        <button id="setting-submit" type="submit" disabled={saving}
          className={`btn-neon w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-1 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <span className="relative z-10 flex items-center gap-2">
            {saving ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</>) : '✓ Simpan Perubahan'}
          </span>
        </button>
      </form>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   OVERLAY TAB
════════════════════════════════════════════════════════════ */
function OverlayTab({ profile, user, sessionToken }) {
  const { toasts, addToast, removeToast } = useToast()
  const [testing, setTesting] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const base = window.location.origin
  const overlayUrls = [
    {
      id: 'alert',
      icon: '🔔',
      label: 'Alert URL',
      url: `${base}/overlay/alert/${profile.id}`,
      desc: 'Popup donasi real-time + TTS. Ukuran: 1920×1080.',
      color: '#a855f7',
    },
    {
      id: 'marquee',
      icon: '📜',
      label: 'Marquee URL',
      url: `${base}/overlay/marquee/${profile.id}`,
      desc: 'Running text histori donasi. Ukuran: 1920×80.',
      color: '#22d3ee',
    },
    {
      id: 'qr',
      icon: '📱',
      label: 'QR Code URL',
      url: `${base}/overlay/qr/${profile.id}`,
      desc: 'QR scan untuk donasi. Ukuran bebas, pojok kiri bawah.',
      color: '#ec4899',
    },
  ]

  const copy = (text, label) =>
    navigator.clipboard.writeText(text).then(() => addToast({ message: `${label} disalin!` }))

  const sendTestAlert = async () => {
    setTesting(true)
    const testDonation = {
      id: Date.now(),
      sender_name: 'Uji Coba 🎮',
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
        // Demo mode: kirim via localStorage storage event
        await new Promise((r) => setTimeout(r, 600))
        localStorage.setItem('nyawer_test_alert', JSON.stringify(testDonation))
      }
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
      addToast({ message: '✓ Test alert terkirim! Cek OBS Overlay.' })
    } catch (err) {
      addToast({ message: err.message ?? 'Gagal kirim test.', type: 'error' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white mb-1">Overlay OBS</h1>
        <p className="text-white/40 text-sm">Salin URL di bawah dan tambahkan sebagai Browser Source di OBS.</p>
      </div>

      {/* OBS instructions */}
      <div className="glass-card p-5 mb-6 border border-yellow-500/15">
        <p className="text-xs font-bold text-yellow-300 mb-2 flex items-center gap-2">
          <span>⚙️</span> Cara Menambahkan ke OBS
        </p>
        <ol className="text-xs text-white/40 space-y-1 list-decimal list-inside">
          <li>Di OBS, klik tombol <strong className="text-white/60">+</strong> di panel Sources</li>
          <li>Pilih <strong className="text-white/60">Browser</strong> → isi URL dari salah satu di bawah</li>
          <li>Atur Width/Height sesuai keterangan masing-masing overlay</li>
          <li>Centang <strong className="text-white/60">"Page background color: transparent"</strong></li>
        </ol>
      </div>

      {/* URL boxes */}
      <div className="flex flex-col gap-4 mb-8">
        {overlayUrls.map(({ id, icon, label, url, desc, color }) => (
          <div key={id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-white/70">{label}</p>
                  <p className="text-[11px] text-white/30">{desc}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => copy(url, label)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-purple-300 transition-all" title="Salin URL">
                  <Copy size={13} />
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-cyan-300 transition-all" title="Buka di tab baru">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
            <code
              className="text-xs font-mono block truncate rounded-xl px-3 py-2.5 border"
              style={{ background: `${color}08`, borderColor: `${color}20`, color: color }}>
              {url}
            </code>
          </div>
        ))}
      </div>

      {/* Test alert section */}
      <div className="glass-card p-6">
        <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
          <Play size={18} className="text-purple-400" />
          Uji Coba Alert
        </h3>
        <p className="text-sm text-white/40 mb-5 leading-relaxed">
          Klik tombol untuk mengirim donasi dummy (50k) ke halaman{' '}
          <a href={`${window.location.origin}/overlay/alert/${profile.id}`} target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Alert Overlay
          </a>.
          Pastikan halaman tersebut sudah terbuka di tab lain atau OBS.
        </p>

        <button id="overlay-test-btn" onClick={sendTestAlert} disabled={testing || testSent}
          className={`btn-neon px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2.5 ${(testing || testSent) ? 'opacity-70 cursor-not-allowed' : ''}`}>
          <span className="relative z-10 flex items-center gap-2">
            {testSent ? (
              <><CheckCircle2 size={16} /> Alert Terkirim!</>
            ) : testing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Mengirim...</>
            ) : (
              <><Play size={15} className="fill-current" /> Kirim Uji Coba Alert</>
            )}
          </span>
        </button>

        {!isSupabaseReady && (
          <p className="text-[11px] text-white/25 mt-3">
            ⚡ Mode Demo — buka halaman Alert Overlay <strong>di tab yang sama browser ini</strong> agar localStorage event bekerja.
          </p>
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
  { id: 'stats',    label: 'Statistik',           icon: BarChart3 },
  { id: 'settings', label: 'Pengaturan Profil',   icon: Settings  },
  { id: 'overlay',  label: 'Overlay & Uji Coba',  icon: Monitor   },
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
        // Fetch profile lewat RPC
        const { data: profileRes, error: profileError } = await supabase
          .rpc('get_current_user_profile', { p_session_token: sessionToken })

        if (profileError) throw profileError
        if (profileRes?.success) {
          setProfile(profileRes.profile)
        } else {
          throw new Error(profileRes?.message || 'Gagal memuat profil.')
        }

        // Fetch donations lewat RPC
        const { data: donationsRes, error: donationsError } = await supabase
          .rpc('get_my_donations', { p_session_token: sessionToken })

        if (donationsError) throw donationsError
        if (donationsRes?.success) {
          setDonations(donationsRes.donations || [])
        } else {
          throw new Error(donationsRes?.message || 'Gagal memuat donasi.')
        }
      } else {
        // Demo/offline mode
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
      // Subscribe to realtime donations changes
      const channel = supabase
        .channel(`dashboard-realtime-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'donations',
          filter: `streamer_id=eq.${user.id}`,
        }, (payload) => {
          console.log('Realtime update received:', payload)
          // Re-fetch to get up-to-date data (and calculated generated columns)
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
        >
          <Zap size={22} className="text-white fill-white" />
        </div>
        <p className="text-white/30 text-sm font-medium tracking-widest uppercase">Memuat Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* ── Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 glass-nav border-r border-white/[0.04] p-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#22d3ee)' }}>
            <Zap size={14} className="text-white fill-white" />
          </div>
          <span className="font-display font-black text-xl tracking-widest"
            style={{
              background: 'linear-gradient(90deg,#c084fc,#22d3ee)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite',
            }}>
            NYAWER
          </span>
        </Link>

        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3 px-2">Menu</p>

        <nav className="flex flex-col gap-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                tab === id
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={16} />{label}
            </button>
          ))}

          <div className="divider-neon my-3" />

          <a href={`/pay/${profile.username}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-cyan-300 hover:bg-white/5 transition-all">
            <ExternalLink size={16} /> Halaman Donasi
          </a>
        </nav>

        {/* Profile + logout */}
        <div className="glass-card p-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-display font-black text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#22d3ee)' }}>
              {profile.display_name[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{profile.display_name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email ?? 'demo@nyawer.id'}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-all border border-white/5 hover:border-red-400/20">
            <LogOut size={13} /> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-auto">
        {/* Mobile tab bar */}
        <div className="lg:hidden glass-card p-1 flex gap-1 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tab === id ? 'bg-purple-500/20 text-purple-300' : 'text-white/35 hover:text-white'
              }`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Bg orb */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

        {tab === 'stats'    && <StatsTab profile={profile} donations={donations} onRefresh={fetchDashboardData} />}
        {tab === 'settings' && <SettingsTab profile={profile} onProfileUpdate={(u) => setProfile((p) => ({ ...p, ...u }))} sessionToken={sessionToken} />}
        {tab === 'overlay'  && <OverlayTab profile={profile} user={user} sessionToken={sessionToken} />}
      </main>
    </div>
  )
}

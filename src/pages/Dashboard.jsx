import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, BarChart3, Settings, Copy, ExternalLink, RefreshCw,
  TrendingUp, Users, DollarSign, Monitor, LogOut, Play, CheckCircle2,
  Bell, FileText, Smartphone, HelpCircle
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/ui/Toast'
import StatusBadge from '../components/ui/StatusBadge'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { MOCK_PROFILE, MOCK_DONATIONS } from '../lib/mockData'
import { formatRp, formatDate } from '../lib/utils'

/* ── Shared styles (Refined Shape and Color Locks) ─────────── */
const INPUT = 'w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-zinc-900 transition-colors'
const LABEL = 'block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5'

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
    { label: 'Total Donasi Masuk', value: formatRp(totalGross),    sub: `${successOnly.length} transaksi sukses`, icon: DollarSign },
    { label: 'Pendapatan Bersih',  value: formatRp(totalReceived), sub: 'Setelah potongan 4%',                    icon: TrendingUp },
    { label: 'Total Donatur',      value: String(successOnly.length),       sub: 'Sepanjang waktu',                        icon: Users },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">
          Halo, {profile.display_name}
        </h1>
        <p className="text-zinc-500 text-xs">Ringkasan aktivitas donasi Anda hari ini.</p>
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

      {/* Donation table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/40 bg-zinc-900/10">
          <h3 className="font-display font-bold text-sm text-zinc-100">5 Donasi Terakhir</h3>
          <button onClick={onRefresh} className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
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
              {donations.slice(0, 5).map((d) => (
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

      <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center font-display font-black text-xl text-white bg-violet-600">
            {(form.display_name?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-zinc-100 text-sm">{form.display_name || 'Display Name'}</p>
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
              onChange={(e) => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="usernamekamu" className={`${INPUT} rounded-l-none border-l-0`} />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5">Hanya huruf kecil, angka, dan underscore.</p>
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
      icon: Bell,
      label: 'Alert URL',
      url: `${base}/overlay/alert/${profile.id}`,
      desc: 'Popup donasi real-time. Ukuran: 1920×1080.',
      color: '#7c3aed',
    },
    {
      id: 'marquee',
      icon: FileText,
      label: 'Marquee URL',
      url: `${base}/overlay/marquee/${profile.id}`,
      desc: 'Running text histori donasi. Ukuran: 1920×80.',
      color: '#a1a1aa',
    },
    {
      id: 'qr',
      icon: Smartphone,
      label: 'QR Code URL',
      url: `${base}/overlay/qr/${profile.id}`,
      desc: 'QR scan untuk donasi. Ukuran bebas.',
      color: '#71717a',
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
        // Demo mode: kirim via localStorage storage event
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
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-zinc-100 mb-1">Overlay OBS</h1>
        <p className="text-zinc-500 text-xs">Salin URL di bawah dan tambahkan sebagai Browser Source di OBS.</p>
      </div>

      {/* OBS instructions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-5">
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
      <div className="flex flex-col gap-4 mb-6">
        {overlayUrls.map(({ id, icon: IconComponent, label, url, desc, color }) => (
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
            <code
              className="text-xs font-mono block truncate rounded-lg px-3 py-2 border bg-zinc-900 border-zinc-800/80 text-violet-400">
              {url}
            </code>
          </div>
        ))}
      </div>

      {/* Test alert section */}
      <div className="glass-card p-5">
        <h3 className="font-display font-bold text-base text-zinc-100 mb-2 flex items-center gap-2">
          <Play size={15} className="text-violet-400 fill-current" />
          Uji Coba Alert
        </h3>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Klik tombol untuk mengirim donasi uji coba (Rp 50.000) ke halaman{' '}
          <a href={`${window.location.origin}/overlay/alert/${profile.id}`} target="_blank" rel="noopener noreferrer"
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
        <div className="w-10 h-10 rounded-lg flex items-center justify-center animate-pulse bg-zinc-900 border border-zinc-800">
          <Zap size={18} className="text-violet-400 fill-current" />
        </div>
        <p className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">Memuat Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* ── Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-zinc-950 border-r border-zinc-900 p-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-600">
            <Zap size={14} className="text-white fill-white" />
          </div>
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
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-display font-black text-xs text-white bg-violet-600">
              {profile.display_name[0]?.toUpperCase()}
            </div>
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

        {tab === 'stats'    && <StatsTab profile={profile} donations={donations} onRefresh={fetchDashboardData} />}
        {tab === 'settings' && <SettingsTab profile={profile} onProfileUpdate={(u) => setProfile((p) => ({ ...p, ...u }))} sessionToken={sessionToken} />}
        {tab === 'overlay'  && <OverlayTab profile={profile} user={user} sessionToken={sessionToken} />}
      </main>
    </div>
  )
}

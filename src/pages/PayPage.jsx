import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Zap, Heart, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import { MOCK_PROFILE } from '../lib/mockData'
import { formatRp } from '../lib/utils'

/* ── Nominal presets ────────────────────────────────────────── */
const PRESETS = [10000, 25000, 50000, 100000]

/* ── Avatar placeholder ─────────────────────────────────────── */
function Avatar({ name, size = 80 }) {
  const initial = (name ?? '?')[0].toUpperCase()
  return (
    <div
      className="rounded-3xl flex items-center justify-center font-display font-black text-white flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
        fontSize: size * 0.35,
        boxShadow: '0 0 40px rgba(124,58,237,0.4)',
      }}
    >
      {initial}
    </div>
  )
}

/* ── Success screen ─────────────────────────────────────────── */
function SuccessScreen({ streamer, amount, onReset }) {
  return (
    <div className="text-center py-16 flex flex-col items-center gap-6 animate-slide-up">
      <div className="relative">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)', boxShadow: '0 0 60px rgba(168,85,247,0.4)' }}>
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <div className="absolute -top-2 -right-2 text-2xl animate-float">🎉</div>
      </div>

      <div>
        <h2 className="font-display font-black text-3xl text-white mb-2">Nyawer Terkirim!</h2>
        <p className="text-white/50 text-sm">
          Kamu nyawer <strong className="text-purple-300">{formatRp(amount)}</strong> ke{' '}
          <strong className="text-white">{streamer.display_name}</strong>. Menunggu konfirmasi pembayaran.
        </p>
      </div>

      <div className="glass-card px-6 py-4 text-sm text-white/40 flex items-center gap-2">
        <AlertCircle size={14} className="text-yellow-400 flex-shrink-0" />
        Status donasi akan berubah ke <strong className="text-white ml-1">Sukses</strong> setelah pembayaran dikonfirmasi.
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={onReset} className="btn-glass px-6 py-3 rounded-xl text-sm font-semibold">
          Nyawer Lagi
        </button>
        <Link to="/" className="btn-neon px-6 py-3 rounded-xl text-sm font-bold">
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAY PAGE
════════════════════════════════════════════════════════════ */
export default function PayPage() {
  const { username } = useParams()

  // In production: fetch profile by username from Supabase
  // For demo: use MOCK_PROFILE if username matches, else substitute username
  const streamer = { ...MOCK_PROFILE, username: username ?? MOCK_PROFILE.username,
                     display_name: username ? `@${username}` : MOCK_PROFILE.display_name }

  const [form, setForm]     = useState({ sender_name: '', amount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const fee = form.amount ? Math.round(Number(form.amount) * 0.04) : 0
  const net = form.amount ? Number(form.amount) - fee : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)

    if (amount < (streamer.min_donation ?? 10000)) {
      addToast({ message: `Minimum donasi ${formatRp(streamer.min_donation)}`, type: 'error' })
      return
    }

    setLoading(true)
    try {
      if (isSupabaseReady && supabase) {
        // Real Supabase insert
        const { error } = await supabase.from('donations').insert({
          streamer_id:  streamer.id,
          sender_name:  form.sender_name.trim() || 'Anonim',
          amount,
          message:      form.message.trim(),
          status:       'pending',
        })
        if (error) throw error
      } else {
        // Simulated — delay to mimic network
        await new Promise((r) => setTimeout(r, 1400))
      }
      setSuccess(true)
    } catch (err) {
      addToast({ message: 'Gagal mengirim donasi. Coba lagi.', type: 'error' })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const INPUT = 'w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all'

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background orb */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link to="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8">
          <ArrowLeft size={15} /> Kembali
        </Link>

        {success ? (
          <div className="glass-card p-8 rounded-3xl">
            <SuccessScreen streamer={streamer} amount={Number(form.amount)} onReset={() => { setSuccess(false); setForm({ sender_name: '', amount: '', message: '' }) }} />
          </div>
        ) : (
          <>
            {/* Streamer profile card */}
            <div className="glass-card p-6 rounded-3xl mb-4 flex items-center gap-5">
              <Avatar name={streamer.display_name} size={72} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-black text-xl text-white truncate">{streamer.display_name}</h1>
                  <span className="flex-shrink-0">
                    <Zap size={14} className="text-purple-400" />
                  </span>
                </div>
                <p className="text-xs text-white/40 mb-2">nyawer.id/{streamer.username}</p>
                {streamer.bio && (
                  <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{streamer.bio}</p>
                )}
                <div className="mt-2 text-[11px] text-white/30 flex items-center gap-1">
                  <Heart size={10} className="text-pink-400" />
                  Min. donasi <strong className="text-white/50 ml-1">{formatRp(streamer.min_donation)}</strong>
                </div>
              </div>
            </div>

            {/* Donation form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl flex flex-col gap-5">
              <h2 className="font-display font-bold text-lg text-white">Kirim Dukungan 💜</h2>

              {/* Sender name */}
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                  Nama Pengirim
                </label>
                <input id="pay-sender-name" type="text" value={form.sender_name} maxLength={50}
                  onChange={(e) => set('sender_name', e.target.value)}
                  placeholder="Namamu (kosongkan untuk Anonim)"
                  className={INPUT} />
              </div>

              {/* Amount presets */}
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                  Nominal Donasi
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESETS.map((p) => (
                    <button key={p} type="button"
                      id={`pay-preset-${p}`}
                      onClick={() => set('amount', String(p))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        Number(form.amount) === p
                          ? 'bg-purple-500/25 border border-purple-400/50 text-purple-200'
                          : 'glass-card border border-white/[0.06] text-white/40 hover:text-white hover:border-white/20'
                      }`}>
                      {p >= 1000 ? `${p / 1000}k` : p}
                    </button>
                  ))}
                </div>
                <input id="pay-amount" type="number" value={form.amount} required min={streamer.min_donation} step={1000}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder={`Min. ${formatRp(streamer.min_donation)}`}
                  className={INPUT} />

                {/* Fee breakdown */}
                {form.amount && Number(form.amount) >= 1000 && (
                  <div className="mt-2.5 glass-card rounded-xl p-3 text-[12px] flex flex-col gap-1">
                    <div className="flex justify-between text-white/40">
                      <span>Nominal</span><span>{formatRp(Number(form.amount))}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Potongan Nyawer (4%)</span><span>- {formatRp(fee)}</span>
                    </div>
                    <div className="divider-neon my-1" />
                    <div className="flex justify-between font-bold text-purple-300">
                      <span>Diterima Streamer</span>
                      <span>{formatRp(net)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                  Pesan Dukungan <span className="text-white/20 normal-case">(opsional, maks 300 karakter)</span>
                </label>
                <textarea id="pay-message" value={form.message} maxLength={300} rows={3}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Tulis semangat, request lagu, atau apapun... 🎮"
                  className={`${INPUT} resize-none`} />
                <p className="text-[10px] text-white/20 mt-1">{form.message.length}/300</p>
              </div>

              {/* CTA button */}
              <button id="pay-submit" type="submit" disabled={loading}
                className={`btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 relative z-10">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Heart size={16} className="fill-current" />
                      Kirim via QRIS / E-Wallet
                      <Zap size={16} />
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-[11px] text-white/20">
                🔒 Transaksi aman & terenkripsi. Powered by Nyawer.
              </p>
            </form>
          </>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

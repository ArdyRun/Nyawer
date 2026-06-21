import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Zap, Heart, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import Avatar from '../components/ui/Avatar'
import { MOCK_PROFILE } from '../lib/mockData'
import { formatRp } from '../lib/utils'

/* ── Nominal presets ────────────────────────────────────────── */
const PRESETS = [10000, 25000, 50000, 100000]

/* ── Success screen ─────────────────────────────────────────── */
function SuccessScreen({ streamer, amount, onReset }) {
  return (
    <div className="text-center py-8 flex flex-col items-center gap-5 animate-slide-up">
      <div className="flex justify-center mb-1">
        <img src="/mascot-success.png" alt="Sukses Mascot" className="w-28 h-28 object-contain" />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-zinc-100 mb-1.5">Nyawer Terkirim!</h2>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
          Kamu mengirim <strong className="text-zinc-200">{formatRp(amount)}</strong> ke{' '}
          <strong className="text-zinc-200">{streamer.display_name}</strong>. Menunggu konfirmasi pembayaran.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-3 text-xs text-zinc-400 flex items-center gap-2 max-w-sm">
        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
        <span>Status donasi akan berubah ke <strong className="text-zinc-200 font-semibold">Sukses</strong> setelah pembayaran dikonfirmasi.</span>
      </div>

      <div className="flex gap-2.5 flex-wrap justify-center w-full">
        <button onClick={onReset} className="btn-glass px-5 py-2.5 text-xs font-semibold flex-1 sm:flex-initial">
          Nyawer Lagi
        </button>
        <Link to="/" className="btn-neon px-5 py-2.5 text-xs font-semibold flex-1 sm:flex-initial text-center">
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

  const [streamer, setStreamer] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [form, setForm]     = useState({ sender_name: '', amount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    if (!username) {
      setProfileError(true)
      setProfileLoading(false)
      return
    }

    if (isSupabaseReady && supabase) {
      setProfileLoading(true)
      setProfileError(false)
      supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.error('Error fetching profile:', error)
            setProfileError(true)
          } else {
            setStreamer(data)
          }
          setProfileLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setProfileError(true)
          setProfileLoading(false)
        })
    } else {
      // Demo mode fallback
      const demoProfile = {
        ...MOCK_PROFILE,
        username: username,
        display_name: `@${username}`
      }
      setStreamer(demoProfile)
      setProfileLoading(false)
    }
  }, [username])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const fee = form.amount ? Math.round(Number(form.amount) * 0.04) : 0
  const net = form.amount ? Number(form.amount) - fee : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)

    if (amount < (streamer?.min_donation ?? 10000)) {
      addToast({ message: `Minimum donasi ${formatRp(streamer?.min_donation ?? 10000)}`, type: 'error' })
      return
    }

    setLoading(true)
    try {
      if (isSupabaseReady && supabase) {
        const { error } = await supabase.from('donations').insert({
          streamer_id:  streamer.id,
          sender_name:  form.sender_name.trim() || 'Anonim',
          amount,
          message:      form.message.trim(),
          status:       'success',
          is_test:      false,
        })
        if (error) throw error
      } else {
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

  const INPUT = 'w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-zinc-900 transition-colors'
  const LABEL = 'block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Back link */}
        <Link to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>

        {profileLoading ? (
          <div className="glass-card p-6 md:p-8 rounded-xl text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <p className="text-zinc-500 text-xs">Memuat profil streamer...</p>
          </div>
        ) : profileError || !streamer ? (
          <div className="glass-card p-6 md:p-8 rounded-xl text-center flex flex-col items-center gap-4">
            <img src="/mascot-error.png" alt="Error Mascot" className="w-24 h-24 object-contain mb-1" />
            <div>
              <h2 className="font-display font-bold text-base text-zinc-100 mb-1">Streamer Tidak Ditemukan</h2>
              <p className="text-zinc-500 text-xs">Username <strong className="text-zinc-300 font-semibold">@{username}</strong> tidak terdaftar di sistem kami.</p>
            </div>
            <Link to="/" className="btn-neon px-4 py-2 text-xs font-semibold w-full text-center">
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        ) : success ? (
          <div className="glass-card p-6 md:p-8 rounded-xl">
            <SuccessScreen streamer={streamer} amount={Number(form.amount)} onReset={() => { setSuccess(false); setForm({ sender_name: '', amount: '', message: '' }) }} />
          </div>
        ) : (
          <>
            {/* Streamer profile card */}
            <div className="glass-card p-5 rounded-xl mb-4 flex items-center gap-4">
              <Avatar src={streamer.avatar_url} name={streamer.display_name} size={56} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="font-display font-bold text-base text-zinc-100 truncate">{streamer.display_name}</h1>
                  <Zap size={12} className="text-violet-400 fill-current" />
                </div>
                <p className="text-[11px] text-zinc-500 mb-1.5">nyawer.id/{streamer.username}</p>
                {streamer.bio && (
                  <p className="text-xs text-zinc-400 leading-normal line-clamp-2">{streamer.bio}</p>
                )}
                <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
                  <Heart size={10} className="text-zinc-500" />
                  <span>Min. donasi</span>
                  <strong className="text-zinc-300 font-semibold">{formatRp(streamer.min_donation)}</strong>
                </div>
              </div>
            </div>

            {/* Donation form */}
            <form onSubmit={handleSubmit} className="glass-card p-5 rounded-xl flex flex-col gap-4">
              <h2 className="font-display font-bold text-base text-zinc-100">Kirim Dukungan</h2>

              {/* Sender name */}
              <div>
                <label className={LABEL}>Nama Pengirim</label>
                <input id="pay-sender-name" type="text" value={form.sender_name} maxLength={50}
                  onChange={(e) => set('sender_name', e.target.value)}
                  placeholder="Namamu (kosongkan untuk Anonim)"
                  className={INPUT} />
              </div>

              {/* Amount presets */}
              <div>
                <label className={LABEL}>Nominal Donasi</label>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {PRESETS.map((p) => (
                    <button key={p} type="button"
                      id={`pay-preset-${p}`}
                      onClick={() => set('amount', String(p))}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        Number(form.amount) === p
                          ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300'
                          : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/40'
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
                  <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between text-zinc-500">
                      <span>Nominal</span><span>{formatRp(Number(form.amount))}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Potongan Nyawer (4%)</span><span>- {formatRp(fee)}</span>
                    </div>
                    <div className="divider-neon my-0.5" />
                    <div className="flex justify-between font-bold text-violet-400">
                      <span>Diterima Streamer</span>
                      <span>{formatRp(net)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className={LABEL}>Pesan Dukungan <span className="text-zinc-500 font-normal normal-case">(opsional)</span></label>
                <textarea id="pay-message" value={form.message} maxLength={300} rows={3}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Tulis pesan semangat untuk streamer..."
                  className={`${INPUT} resize-none`} />
                <p className="text-[10px] text-zinc-500 mt-1">{form.message.length}/300</p>
              </div>

              {/* CTA button */}
              <button id="pay-submit" type="submit" disabled={loading}
                className={`btn-neon w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {loading ? (
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Heart size={14} className="fill-current" />
                )}
                <span>{loading ? 'Memproses...' : 'Kirim Dukungan'}</span>
              </button>

              <p className="text-center text-[10px] text-zinc-500">
                🔒 Transaksi aman & terenkripsi. Didukung oleh Nyawer.
              </p>
            </form>
          </>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

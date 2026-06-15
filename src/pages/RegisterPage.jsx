import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseReady } from '../lib/supabase'

const INPUT = 'w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.08] transition-all'
const LABEL = 'block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()

  const [form, setForm]       = useState({ displayName: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return }
    setLoading(true)
    try {
      const { data, error: authError } = await signUp(form.email, form.password, form.displayName)
      if (authError) throw authError

      if (isSupabaseReady && !data?.session) {
        // Email konfirmasi dikirim — belum otomatis login
        setSuccess(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message ?? 'Pendaftaran gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error: authError } = await signInWithGoogle()
      if (authError) throw authError
      if (!isSupabaseReady) navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  /* ── Success state ─────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="glass-card p-10 rounded-3xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)' }}>
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h2 className="font-display font-black text-2xl text-white mb-3">Cek Email Kamu! 📬</h2>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            Link konfirmasi sudah dikirim ke{' '}
            <strong className="text-purple-300">{form.email}</strong>.
            Klik link tersebut untuk mengaktifkan akunmu.
          </p>
          <Link to="/login" className="btn-neon px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2">
            <span>Ke Halaman Login</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden py-10">
      {/* Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}>
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="font-display font-black text-3xl tracking-widest"
            style={{
              background: 'linear-gradient(90deg,#e2e8f0,#a855f7,#22d3ee,#e2e8f0)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
            NYAWER
          </span>
        </div>

        <div className="glass-card p-8 rounded-3xl">
          <h1 className="font-display font-black text-2xl text-white mb-1">Buat akun baru ⚡</h1>
          <p className="text-white/40 text-sm mb-8">Gratis selamanya. Potongan flat 4% saja.</p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Display Name */}
            <div>
              <label className={LABEL}>Nama Tampil</label>
              <input id="reg-display-name" type="text" value={form.displayName} required maxLength={50}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="Namamu (muncul di halaman donasi)"
                className={INPUT} />
            </div>

            {/* Email */}
            <div>
              <label className={LABEL}>Email</label>
              <input id="reg-email" type="email" value={form.email} required
                onChange={(e) => set('email', e.target.value)}
                placeholder="kamu@email.com"
                className={INPUT} />
            </div>

            {/* Password */}
            <div>
              <label className={LABEL}>Password</label>
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password} required minLength={6}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className={`${INPUT} pr-12`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[6, 8, 12].map((len, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: form.password.length >= len ? (i === 2 ? '#22c55e' : i === 1 ? '#f59e0b' : '#ef4444') : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              )}
            </div>

            <button id="reg-submit" type="submit" disabled={loading}
              className={`btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Mendaftar...</>
                ) : (<><Zap size={16} className="fill-current" />Daftar Gratis</>)}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25 font-medium">atau daftar dengan</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google */}
          <button id="reg-google" onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all btn-glass"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {googleLoading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <GoogleIcon />}
            <span className="text-white/80">Daftar dengan Google</span>
          </button>

          <p className="text-center text-sm text-white/30 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Masuk
            </Link>
          </p>
        </div>

        {!isSupabaseReady && (
          <p className="text-center text-[11px] text-white/20 mt-4">
            ⚡ Mode Demo — isi form dengan data apapun untuk mencoba
          </p>
        )}
      </div>
    </div>
  )
}

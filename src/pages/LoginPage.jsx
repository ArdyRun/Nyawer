import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseReady } from '../lib/supabase'

/* ── Shared styles ─────────────────────────────────────────── */
const INPUT = 'w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.08] transition-all'
const LABEL = 'block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2'

/* ── Google icon SVG ───────────────────────────────────────── */
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

/* ════════════════════════════════════════════════════════════
   LOGIN PAGE
════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  /* ── Email/Password Login ─────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await signIn(form.email, form.password)
      if (authError) throw authError
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login gagal. Periksa email dan password kamu.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Google OAuth ─────────────────────────────────────── */
  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error: authError } = await signInWithGoogle()
      if (authError) throw authError
      // Jika demo mode (tidak redirect otomatis), navigate manual
      if (!isSupabaseReady) navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)' }} />
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-25"
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
              background: 'linear-gradient(90deg, #e2e8f0, #a855f7, #22d3ee, #e2e8f0)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
            NYAWER
          </span>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-3xl">
          <h1 className="font-display font-black text-2xl text-white mb-1">Selamat datang kembali 👋</h1>
          <p className="text-white/40 text-sm mb-8">Masuk untuk kelola donasi streammu.</p>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className={LABEL}>Email</label>
              <input id="login-email" type="email" value={form.email} required
                onChange={(e) => set('email', e.target.value)}
                placeholder="kamu@email.com"
                className={INPUT} />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={LABEL} style={{ marginBottom: 0 }}>Password</label>
                <button type="button"
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} value={form.password} required
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={`${INPUT} pr-12`} />
                <button type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading}
              className={`btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>Masuk...</>
                ) : (<><Zap size={16} className="fill-current" /> Masuk ke Dashboard</>)}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25 font-medium">atau lanjutkan dengan</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google */}
          <button id="login-google" onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all btn-glass hover:border-white/20"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {googleLoading
              ? <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <GoogleIcon />}
            <span className="text-white/80">Masuk dengan Google</span>
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-white/30 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Daftar gratis
            </Link>
          </p>
        </div>

        {/* Demo mode notice */}
        {!isSupabaseReady && (
          <div className="mt-4 text-center">
            <p className="text-[11px] text-white/20">
              ⚡ Mode Demo — login dengan email & password apapun untuk mencoba
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

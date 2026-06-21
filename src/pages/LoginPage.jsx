import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseReady } from '../lib/supabase'

/* ── Shared styles (Refined Shape and Color Locks) ─────────── */
const INPUT = 'w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-zinc-900 transition-colors'
const LABEL = 'block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5'

/* ── Google icon SVG ───────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#e4e4e7" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#a1a1aa" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#71717a" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#e4e4e7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
      if (!isSupabaseReady) navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          {/* Logo & Mascot Group */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Nyawer" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-display font-bold text-lg tracking-wider text-zinc-50">
                NYAWER
              </span>
            </div>
            <img src="/mascot-id.png" alt="Nyawer Mascot" className="w-24 h-24 object-contain" />
          </div>

          <h1 className="font-display font-bold text-lg text-zinc-100 mb-1 text-center">Selamat datang kembali</h1>
          <p className="text-zinc-500 text-xs mb-6 text-center">Masuk untuk kelola donasi streaming Anda.</p>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-5 text-xs bg-red-950/20 border border-red-800/30 text-red-400">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <div className="flex justify-between items-center mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Password</label>
                <button type="button"
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} value={form.password} required
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={`${INPUT} pr-10`} />
                <button type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading}
              className={`btn-neon w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mt-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {loading ? (
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Zap size={14} className="fill-current" />
              )}
              <span>{loading ? 'Masuk...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800/40" />
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-zinc-800/40" />
          </div>

          {/* Google */}
          <button id="login-google" onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold btn-glass">
            {googleLoading ? (
              <svg className="animate-spin w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            <span>Masuk dengan Google</span>
          </button>

          {/* Register link */}
          <p className="text-center text-xs text-zinc-500 mt-5">
            Belum punya akun?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Daftar gratis
            </Link>
          </p>
        </div>

        {/* Demo mode notice */}
        {!isSupabaseReady && (
          <div className="mt-4 text-center">
            <p className="text-[10px] text-zinc-600">
              Mode Demo - login dengan email & password apa saja untuk mencoba
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

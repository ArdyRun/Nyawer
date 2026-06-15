import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

/* ── Demo user (dipakai saat Supabase belum dikonfigurasi) ─── */
const DEMO_USER = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'demo@nyawer.id',
  user_metadata: { full_name: 'Demo Streamer' },
}

const AuthContext = createContext(null)

/* ════════════════════════════════════════════════════════════
   AUTH PROVIDER
════════════════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady || !supabase) {
      // Demo mode: periksa localStorage untuk sesi demo
      const stored = localStorage.getItem('nyawer_demo_session')
      if (stored) setUser(JSON.parse(stored))
      setLoading(false)
      return
    }

    // Ambil sesi yang sedang aktif
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Dengarkan perubahan auth state (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  /* ── Login email/password ─────────────────────────────── */
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseReady || !supabase) {
      const demo = { ...DEMO_USER, email }
      localStorage.setItem('nyawer_demo_session', JSON.stringify(demo))
      setUser(demo)
      return { data: { user: demo }, error: null }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  /* ── Register email/password ──────────────────────────── */
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseReady || !supabase) {
      const demo = { ...DEMO_USER, email, user_metadata: { full_name: displayName } }
      localStorage.setItem('nyawer_demo_session', JSON.stringify(demo))
      setUser(demo)
      return { data: { user: demo }, error: null }
    }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    })
  }, [])

  /* ── Login Google OAuth ───────────────────────────────── */
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseReady || !supabase) {
      // Demo mode: langsung masuk sebagai demo user
      localStorage.setItem('nyawer_demo_session', JSON.stringify(DEMO_USER))
      setUser(DEMO_USER)
      return { data: null, error: null }
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }, [])

  /* ── Logout ───────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    if (!isSupabaseReady || !supabase) {
      localStorage.removeItem('nyawer_demo_session')
      setUser(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Gunakan hook ini di seluruh aplikasi untuk mengakses auth state. */
export const useAuth = () => useContext(AuthContext)

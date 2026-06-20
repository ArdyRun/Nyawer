import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

/* ── Demo user (dipakai saat Supabase belum dikonfigurasi) ─── */
const DEMO_USER = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'demo@nyawer.id',
}
const DEMO_PROFILE = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  username: 'cobazeus',
  display_name: 'Demo Streamer',
  min_donation: 10000,
  bio: 'Main game seru-seruan bareng viewer! Jangan lupa pencet tombol nyawer 🎮',
}

const AuthContext = createContext(null)

/* ════════════════════════════════════════════════════════════
   AUTH PROVIDER (CUSTOM TABLE & SESSION TOKEN)
   ════════════════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const initSession = async () => {
      if (!isSupabaseReady || !supabase) {
        // Demo mode: periksa localStorage untuk sesi demo
        try {
          const storedToken = localStorage.getItem('nyawer_demo_session_token')
          const storedUser = localStorage.getItem('nyawer_demo_user')
          const storedProfile = localStorage.getItem('nyawer_demo_profile')

          if (storedToken && storedUser && storedProfile) {
            setSessionToken(storedToken)
            setUser(JSON.parse(storedUser))
            setProfile(JSON.parse(storedProfile))
          }
        } catch (err) {
          console.error('Error parsing demo session:', err)
        }
        setLoading(false)
        return
      }

      // Sesi Supabase Kustom
      try {
        const token = localStorage.getItem('nyawer_session_token')
        if (token) {
          // Validasi session token lewat RPC
          const { data, error } = await supabase.rpc('get_current_user_profile', {
            p_session_token: token
          })

          if (!error && data?.success) {
            setSessionToken(token)
            setUser(data.user)
            setProfile(data.profile)
          } else {
            // Token tidak valid / kedaluwarsa
            localStorage.removeItem('nyawer_session_token')
            localStorage.removeItem('nyawer_user')
            localStorage.removeItem('nyawer_profile')
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err)
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [])

  /* ── Login email/password (RPC) ───────────────────────── */
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseReady || !supabase) {
      // Demo mode
      const token = 'demo-session-token'
      const userObj = { ...DEMO_USER, email }
      const profileObj = { ...DEMO_PROFILE, display_name: email.split('@')[0] }

      localStorage.setItem('nyawer_demo_session_token', token)
      localStorage.setItem('nyawer_demo_user', JSON.stringify(userObj))
      localStorage.setItem('nyawer_demo_profile', JSON.stringify(profileObj))

      setSessionToken(token)
      setUser(userObj)
      setProfile(profileObj)
      return { data: { user: userObj }, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('login_user', {
        p_email: email,
        p_password: password
      })

      if (error) throw error

      if (data?.success) {
        localStorage.setItem('nyawer_session_token', data.session_token)
        localStorage.setItem('nyawer_user', JSON.stringify(data.user))
        localStorage.setItem('nyawer_profile', JSON.stringify(data.profile))

        setSessionToken(data.session_token)
        setUser(data.user)
        setProfile(data.profile)
        return { data: { user: data.user }, error: null }
      } else {
        return { data: null, error: new Error(data?.message || 'Login gagal.') }
      }
    } catch (err) {
      return { data: null, error: err }
    }
  }, [])

  /* ── Register email/password (RPC) ────────────────────── */
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseReady || !supabase) {
      // Demo mode
      const token = 'demo-session-token'
      const userObj = { ...DEMO_USER, email }
      const profileObj = { ...DEMO_PROFILE, display_name: displayName }

      localStorage.setItem('nyawer_demo_session_token', token)
      localStorage.setItem('nyawer_demo_user', JSON.stringify(userObj))
      localStorage.setItem('nyawer_demo_profile', JSON.stringify(profileObj))

      setSessionToken(token)
      setUser(userObj)
      setProfile(profileObj)
      return { data: { user: userObj }, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('register_user', {
        p_email: email,
        p_password: password,
        p_display_name: displayName
      })

      if (error) throw error

      if (data?.success) {
        localStorage.setItem('nyawer_session_token', data.session_token)
        localStorage.setItem('nyawer_user', JSON.stringify(data.user))
        localStorage.setItem('nyawer_profile', JSON.stringify(data.profile))

        setSessionToken(data.session_token)
        setUser(data.user)
        setProfile(data.profile)
        return { data: { user: data.user }, error: null }
      } else {
        return { data: null, error: new Error(data?.message || 'Registrasi gagal.') }
      }
    } catch (err) {
      return { data: null, error: err }
    }
  }, [])

  /* ── Login Google OAuth (Dinonaktifkan demi Keamanan) ──── */
  const signInWithGoogle = useCallback(async () => {
    return { data: null, error: new Error('Login Google dinonaktifkan untuk kustom autentikasi.') }
  }, [])

  /* ── Logout (RPC) ─────────────────────────────────────── */
  const signOut = useCallback(async () => {
    if (!isSupabaseReady || !supabase) {
      localStorage.removeItem('nyawer_demo_session_token')
      localStorage.removeItem('nyawer_demo_user')
      localStorage.removeItem('nyawer_demo_profile')
      setSessionToken(null)
      setUser(null)
      setProfile(null)
      return
    }

    try {
      if (sessionToken) {
        await supabase.rpc('logout_user', { p_session_token: sessionToken })
      }
    } catch (err) {
      console.error('Logout error on server:', err)
    } finally {
      localStorage.removeItem('nyawer_session_token')
      localStorage.removeItem('nyawer_user')
      localStorage.removeItem('nyawer_profile')
      setSessionToken(null)
      setUser(null)
      setProfile(null)
    }
  }, [sessionToken])

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, sessionToken, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Gunakan hook ini di seluruh aplikasi untuk mengakses auth state. */
export const useAuth = () => useContext(AuthContext)

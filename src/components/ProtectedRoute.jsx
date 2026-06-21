import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Loading spinner — ditampilkan saat sesi auth sedang dicek */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Nyawer" className="w-14 h-14 rounded-xl object-cover animate-pulse" />
        <p className="text-white/30 text-sm font-medium tracking-widest uppercase">Memuat...</p>
      </div>
    </div>
  )
}

/**
 * Lindungi route dari akses tanpa login.
 * Jika belum login → redirect ke /login.
 * Jika sedang loading → tampilkan spinner.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return children
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage   from './App'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import Dashboard     from './pages/Dashboard'
import PayPage       from './pages/PayPage'
import QROverlay     from './pages/overlay/QROverlay'
import MarqueeOverlay from './pages/overlay/MarqueeOverlay'
import AlertOverlay  from './pages/overlay/AlertOverlay'
import LeaderboardOverlay from './pages/overlay/LeaderboardOverlay'
import GoalOverlay   from './pages/overlay/GoalOverlay'
import ProtectedRoute from './components/ProtectedRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                        element={<LandingPage />} />
        <Route path="/login"                   element={<LoginPage />} />
        <Route path="/register"                element={<RegisterPage />} />
        <Route path="/pay/:username"           element={<PayPage />} />

        {/* Protected — harus login */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* OBS Overlays — publik (diakses dari OBS Browser Source) */}
        <Route path="/overlay/qr/:streamerId"         element={<QROverlay />} />
        <Route path="/overlay/marquee/:streamerId"    element={<MarqueeOverlay />} />
        <Route path="/overlay/alert/:streamerId"      element={<AlertOverlay />} />
        <Route path="/overlay/leaderboard/:streamerId" element={<LeaderboardOverlay />} />
        <Route path="/overlay/goal/:streamerId"       element={<GoalOverlay />} />
      </Routes>
    </BrowserRouter>
  )
}

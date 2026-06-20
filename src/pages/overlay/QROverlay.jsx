/**
 * QROverlay — /overlay/qr/:streamerId
 * OBS Browser Source: tampilkan QR code donasi di layar stream.
 * Background: transparent (OBS chromakey-friendly).
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_PROFILE } from '../../lib/mockData'

export default function QROverlay() {
  const { streamerId } = useParams()
  const [profile, setProfile] = useState(null)

  /* Transparent background untuk OBS */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Fetch profil streamer */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) {
      setProfile(MOCK_PROFILE)
      return
    }
    supabase.from('profiles').select('id,username,display_name').eq('id', streamerId).single()
      .then(({ data }) => setProfile(data ?? MOCK_PROFILE))
      .catch((err) => {
        console.error('Error fetching profile for QR overlay:', err);
        setProfile(MOCK_PROFILE);
      })
  }, [streamerId])

  if (!profile) return null

  const payUrl = `${window.location.origin}/pay/${profile.username}`

  return (
    <div
      className="w-full h-screen flex items-end justify-start p-8"
      style={{ background: 'transparent' }}
    >
      {/* QR Widget */}
      <div
        style={{
          background: 'rgba(5,5,15,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 24,
          padding: 20,
          boxShadow: '0 0 60px rgba(168,85,247,0.2), 0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <p style={{
          fontSize: 10,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          textAlign: 'center',
          marginBottom: 14,
          background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          ✦ Scan untuk Nyawer ✦
        </p>

        {/* QR Code */}
        <div style={{ background: 'white', borderRadius: 16, padding: 12, display: 'flex' }}>
          <QRCodeSVG
            value={payUrl}
            size={160}
            level="M"
            fgColor="#050505"
            bgColor="#ffffff"
          />
        </div>

        {/* Username + Live dot */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600 }}>
            nyawer.id/{profile.username}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 8px #4ade80',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}

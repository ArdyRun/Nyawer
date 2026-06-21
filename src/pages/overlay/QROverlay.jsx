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
          background: 'rgba(9,9,11,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(63, 63, 70, 0.4)',
          borderRadius: 12,
          padding: 14,
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <p style={{
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          textAlign: 'center',
          marginBottom: 8,
          color: '#a1a1aa',
        }}>
          Scan untuk Nyawer
        </p>

        {/* QR Code */}
        <div style={{ background: '#ffffff', borderRadius: 8, padding: 8, display: 'flex' }}>
          <QRCodeSVG
            value={payUrl}
            size={120}
            level="M"
            fgColor="#09090b"
            bgColor="#ffffff"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * MarqueeOverlay — /overlay/marquee/:streamerId
 * OBS Browser Source: running text histori donasi di bagian bawah layar.
 * Background: transparent.
 * Auto-refresh setiap 60 detik.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_DONATIONS, MOCK_PROFILE } from '../../lib/mockData'
import { formatRp, truncate } from '../../lib/utils'

const REFRESH_INTERVAL = 60_000 // 60 detik

export default function MarqueeOverlay() {
  const { streamerId } = useParams()
  const [donations, setDonations] = useState([])
  const [username, setUsername]   = useState('')

  /* Transparent background untuk OBS */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Fetch data donasi */
  const fetchData = useCallback(async () => {
    if (!isSupabaseReady || !supabase || !streamerId) {
      setDonations(MOCK_DONATIONS.filter((d) => d.status === 'success' && !d.is_test).slice(0, 10))
      setUsername(MOCK_PROFILE.username)
      return
    }
    try {
      const [profileRes, donationsRes] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', streamerId).single(),
        supabase.from('donations')
          .select('id,sender_name,amount,message,created_at')
          .eq('streamer_id', streamerId)
          .eq('status', 'success')
          .eq('is_test', false)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      if (profileRes.error) throw profileRes.error
      if (donationsRes.error) throw donationsRes.error

      if (profileRes.data) setUsername(profileRes.data.username)
      if (donationsRes.data) setDonations(donationsRes.data)
    } catch (err) {
      console.error('Error fetching marquee data:', err)
      setDonations(MOCK_DONATIONS.filter((d) => d.status === 'success' && !d.is_test).slice(0, 10))
      setUsername(MOCK_PROFILE.username)
    }
  }, [streamerId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  if (!donations.length) return null

  const items = [...donations, ...donations, ...donations]

  return (
    <div
      className="w-full h-screen flex items-end"
      style={{ background: 'transparent' }}
    >
      {/* Marquee bar */}
      <div
        style={{
          width: '100%',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'rgba(9,9,11,0.95)',
          borderTop: '1px solid rgba(63, 63, 70, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Label pill kiri */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '0 16px',
          height: '100%',
          background: '#7c3aed',
          minWidth: 110,
          zIndex: 2,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffffff' }}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span style={{
            color: 'white',
            fontSize: 9,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Nyawer
          </span>
        </div>

        {/* Scrolling text wrapper */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Left fade */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: 'linear-gradient(90deg, rgba(9,9,11,0.95), transparent)',
          }} />
          {/* Right fade */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: 'linear-gradient(-90deg, rgba(9,9,11,0.95), transparent)',
          }} />

          {/* Marquee text */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            animation: 'marquee-overlay 50s linear infinite',
          }}>
            {items.map((d, i) => (
              <span key={`${d.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {/* Donor name */}
                <span style={{
                  color: '#e4e4e7',
                  fontWeight: 600,
                  fontSize: 13,
                  padding: '0 4px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {d.sender_name}
                </span>
                {/* Amount */}
                <span style={{
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: 'Outfit, sans-serif',
                  color: '#a78bfa',
                  padding: '0 4px',
                }}>
                  {formatRp(d.amount)}
                </span>
                {/* Message */}
                {d.message && (
                  <span style={{ color: '#71717a', fontSize: 12, padding: '0 4px' }}>
                    "{truncate(d.message, 50)}"
                  </span>
                )}
                {/* Separator */}
                <span style={{ color: 'rgba(63,63,70,0.6)', fontSize: 14, margin: '0 16px' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

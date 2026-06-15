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
    if (profileRes.data) setUsername(profileRes.data.username)
    if (donationsRes.data?.length) setDonations(donationsRes.data)
  }, [streamerId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  if (!donations.length) return null

  /* Duplicate items untuk seamless infinite loop */
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
          height: 52,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(90deg, rgba(7,3,17,0.96) 0%, rgba(7,3,17,0.88) 50%, rgba(7,3,17,0.96) 100%)',
          borderTop: '1px solid rgba(168,85,247,0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Label pill kiri */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '0 20px',
          height: '100%',
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          minWidth: 130,
          zIndex: 2,
        }}>
          <span style={{ fontSize: 14 }}>💜</span>
          <span style={{
            color: 'white',
            fontSize: 10,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            Nyawer
          </span>
        </div>

        {/* Scrolling text wrapper */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Left fade */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: 'linear-gradient(90deg, rgba(7,3,17,0.95), transparent)',
          }} />
          {/* Right fade */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: 'linear-gradient(-90deg, rgba(7,3,17,0.95), transparent)',
          }} />

          {/* Marquee text */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            animation: 'marquee 50s linear infinite',
          }}>
            {items.map((d, i) => (
              <span key={`${d.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {/* Donor name */}
                <span style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '0 4px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {d.sender_name}
                </span>
                {/* Amount */}
                <span style={{
                  fontWeight: 900,
                  fontSize: 14,
                  fontFamily: 'Outfit, sans-serif',
                  background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  padding: '0 4px',
                }}>
                  {formatRp(d.amount)}
                </span>
                {/* Message */}
                {d.message && (
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, padding: '0 4px' }}>
                    "{truncate(d.message, 50)}"
                  </span>
                )}
                {/* Separator */}
                <span style={{ color: 'rgba(168,85,247,0.4)', fontSize: 16, margin: '0 20px' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * MarqueeOverlay — /overlay/marquee/:streamerId
 * OBS Browser Source: running text histori donasi di bagian bawah layar.
 * Background: transparent.
 * Auto-refresh setiap 60 detik.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_DONATIONS, MOCK_PROFILE } from '../../lib/mockData'
import { formatRp, truncate } from '../../lib/utils'

const REFRESH_INTERVAL = 60_000 // 60 detik

/* ── Peta Tema Lengkap DaisyUI dengan flag isLight ─── */
const THEMES = {
  default: {
    primary: '#7c3aed',
    accent: '#a78bfa',
    text: '#e4e4e7',
    neutral: 'rgba(9,9,11,0.95)',
    border: 'rgba(63, 63, 70, 0.4)',
    isLight: false,
  },
  light: {
    primary: '#422ad5',
    accent: '#00d3bb',
    text: '#18181b',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(66, 42, 213, 0.15)',
    isLight: true,
  },
  dark: {
    primary: '#605dff',
    accent: '#00d3bb',
    text: '#ecf9ff',
    neutral: 'rgba(29,35,42,0.95)',
    border: 'rgba(96, 93, 255, 0.3)',
    isLight: false,
  },
  cupcake: {
    primary: '#44ebd3',
    accent: '#f9cbe5',
    text: '#291334',
    neutral: 'rgba(250,247,245,0.95)',
    border: 'rgba(68, 235, 211, 0.3)',
    isLight: true,
  },
  bumblebee: {
    primary: '#fdc700',
    accent: '#ff8904',
    text: '#161616',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(253, 199, 0, 0.3)',
    isLight: true,
  },
  emerald: {
    primary: '#66cc8a',
    accent: '#377cfb',
    text: '#333c4d',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(102, 204, 138, 0.3)',
    isLight: true,
  },
  corporate: {
    primary: '#0082ce',
    accent: '#61738d',
    text: '#181a2a',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(0, 130, 206, 0.25)',
    isLight: true,
  },
  synthwave: {
    primary: '#f861b4',
    accent: '#71d1fe',
    text: '#a1b1ff',
    neutral: 'rgba(9,0,47,0.95)',
    border: 'rgba(248, 97, 180, 0.3)',
    isLight: false,
  },
  retro: {
    primary: '#ff9fa0',
    accent: '#b7f6cd',
    text: '#793205',
    neutral: 'rgba(236,227,202,0.95)',
    border: 'rgba(121, 50, 5, 0.2)',
    isLight: true,
  },
  cyberpunk: {
    primary: '#ff6596',
    accent: '#00e8ff',
    text: '#000000',
    neutral: 'rgba(255,242,72,0.95)',
    border: 'rgba(0, 0, 0, 0.35)',
    isLight: true,
  },
  valentine: {
    primary: '#f43098',
    accent: '#ab44ff',
    text: '#c5005a',
    neutral: 'rgba(252,242,248,0.95)',
    border: 'rgba(244, 48, 152, 0.25)',
    isLight: true,
  },
  halloween: {
    primary: '#ff8f00',
    accent: '#7a00c2',
    text: '#cdcdcd',
    neutral: 'rgba(27,24,22,0.95)',
    border: 'rgba(255, 143, 0, 0.3)',
    isLight: false,
  },
  garden: {
    primary: '#fe0075',
    accent: '#8e4162',
    text: '#100f0f',
    neutral: 'rgba(233,231,231,0.95)',
    border: 'rgba(254, 0, 117, 0.2)',
    isLight: true,
  },
  forest: {
    primary: '#1fb854',
    accent: '#1eb88e',
    text: '#cac9c9',
    neutral: 'rgba(27,23,23,0.95)',
    border: 'rgba(31, 184, 84, 0.3)',
    isLight: false,
  },
  aqua: {
    primary: '#13ecf3',
    accent: '#966fb3',
    text: '#b8e6fe',
    neutral: 'rgba(26,54,139,0.95)',
    border: 'rgba(19, 236, 243, 0.3)',
    isLight: false,
  },
  lofi: {
    primary: '#0d0d0d',
    accent: '#262626',
    text: '#000000',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(13, 13, 13, 0.25)',
    isLight: true,
  },
  pastel: {
    primary: '#e9d4ff',
    accent: '#feccd2',
    text: '#161616',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(233, 212, 255, 0.4)',
    isLight: true,
  },
  fantasy: {
    primary: '#6d0076',
    accent: '#0075c2',
    text: '#1f2937',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(109, 0, 118, 0.2)',
    isLight: true,
  },
  wireframe: {
    primary: '#d4d4d4',
    accent: '#d4d4d4',
    text: '#161616',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(212, 212, 212, 0.5)',
    isLight: true,
  },
  black: {
    primary: '#3a3a3a',
    accent: '#3a3a3a',
    text: '#d6d6d6',
    neutral: 'rgba(0,0,0,0.95)',
    border: 'rgba(214, 214, 214, 0.15)',
    isLight: false,
  },
  luxury: {
    primary: '#ffffff',
    accent: '#dca54d',
    text: '#dca54d',
    neutral: 'rgba(9,9,11,0.95)',
    border: 'rgba(220, 165, 77, 0.25)',
    isLight: false,
  },
  dracula: {
    primary: '#ff79c6',
    accent: '#bd93f9',
    text: '#f8f8f3',
    neutral: 'rgba(40,42,54,0.95)',
    border: 'rgba(189, 147, 249, 0.3)',
    isLight: false,
  },
  cmyk: {
    primary: '#45aeee',
    accent: '#e8488a',
    text: '#161616',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(69, 174, 238, 0.25)',
    isLight: true,
  },
  autumn: {
    primary: '#8c0327',
    accent: '#d59b6b',
    text: '#141414',
    neutral: 'rgba(241,241,241,0.95)',
    border: 'rgba(140, 3, 39, 0.2)',
    isLight: true,
  },
  business: {
    primary: '#1c4e80',
    accent: '#7c909a',
    text: '#cdcdcd',
    neutral: 'rgba(32,32,32,0.95)',
    border: 'rgba(28, 78, 128, 0.3)',
    isLight: false,
  },
  acid: {
    primary: '#ff00ff',
    accent: '#c8ff00',
    text: '#000000',
    neutral: 'rgba(255,247,237,0.95)',
    border: 'rgba(255, 0, 255, 0.35)',
    isLight: true,
  },
  lemonade: {
    primary: '#419400',
    accent: '#bdc000',
    text: '#151614',
    neutral: 'rgba(248,253,239,0.95)',
    border: 'rgba(65, 148, 0, 0.25)',
    isLight: true,
  },
  night: {
    primary: '#3abdf7',
    accent: '#818cf8',
    text: '#c9cbd0',
    neutral: 'rgba(15,23,42,0.95)',
    border: 'rgba(58, 189, 247, 0.3)',
    isLight: false,
  },
  coffee: {
    primary: '#db924c',
    accent: '#11576d',
    text: '#c59f61',
    neutral: 'rgba(38,27,37,0.95)',
    border: 'rgba(219, 146, 76, 0.25)',
    isLight: false,
  },
  winter: {
    primary: '#394e6a',
    accent: '#463aa2',
    text: '#161616',
    neutral: 'rgba(255,255,255,0.95)',
    border: 'rgba(57, 78, 106, 0.25)',
    isLight: true,
  },
  dim: {
    primary: '#9fe88d',
    accent: '#ff7d5d',
    text: '#b2ccd6',
    neutral: 'rgba(42,48,60,0.95)',
    border: 'rgba(159, 232, 141, 0.3)',
    isLight: false,
  },
  nord: {
    primary: '#5e81ac',
    accent: '#88c0d0',
    text: '#2e3440',
    neutral: 'rgba(236,239,244,0.95)',
    border: 'rgba(94, 129, 172, 0.25)',
    isLight: true,
  },
  sunset: {
    primary: '#ff865b',
    accent: '#fd6f9c',
    text: '#9fb9d0',
    neutral: 'rgba(18,28,34,0.95)',
    border: 'rgba(255, 134, 91, 0.3)',
    isLight: false,
  },
  abyss: {
    primary: '#bdff00',
    accent: '#cebef4',
    text: '#ffd6a7',
    neutral: 'rgba(0,30,41,0.95)',
    border: 'rgba(189, 255, 0, 0.3)',
    isLight: false,
  },
  silk: {
    primary: '#1c1c29',
    accent: '#1c1c29',
    text: '#4b4743',
    neutral: 'rgba(247,245,243,0.95)',
    border: 'rgba(28, 28, 41, 0.2)',
    isLight: true,
  }
}

export default function MarqueeOverlay() {
  const { streamerId } = useParams()
  const [searchParams] = useSearchParams()
  const [donations, setDonations] = useState([])
  const [username, setUsername]   = useState('')

  // Ambil tema dari URL parameter
  const themeParam = searchParams.get('theme') || 'default'
  const themeConfig = THEMES[themeParam] || THEMES.default

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
          background: themeConfig.neutral,
          borderTop: `1px solid ${themeConfig.border}`,
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
          background: themeConfig.primary,
          minWidth: 110,
          zIndex: 2,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: themeConfig.isLight ? '#09090b' : '#ffffff' }}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span style={{
            color: themeConfig.isLight ? '#09090b' : 'white',
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
            background: `linear-gradient(90deg, ${themeConfig.neutral}, transparent)`,
          }} />
          {/* Right fade */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: `linear-gradient(-90deg, ${themeConfig.neutral}, transparent)`,
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
                  color: themeConfig.text,
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
                  color: themeConfig.accent,
                  padding: '0 4px',
                }}>
                  {formatRp(d.amount)}
                </span>
                {/* Message */}
                {d.message && (
                  <span style={{
                    color: themeConfig.isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)',
                    fontSize: 12,
                    padding: '0 4px',
                    fontStyle: 'italic'
                  }}>
                    "{truncate(d.message, 50)}"
                  </span>
                )}
                {/* Separator */}
                <span style={{ color: themeConfig.isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', fontSize: 14, margin: '0 16px' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

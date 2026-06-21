/**
 * LeaderboardOverlay — /overlay/leaderboard/:streamerId
 * OBS Browser Source: Top 10 donatur berdasarkan total amount.
 * Background: transparent.
 * Realtime update via Supabase Realtime.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_DONATIONS, MOCK_PROFILE } from '../../lib/mockData'
import { formatRp } from '../../lib/utils'

/* ── Peta Tema Lengkap DaisyUI (Konversi dari OKLCH ke HEX) ─── */
const THEMES = {
  default: {
    primary: '#7c3aed',
    accent: '#a78bfa',
    text: '#fafafa',
    neutral: '#18181b',
    border: 'rgba(63, 63, 70, 0.4)',
    isLight: false,
  },
  light: {
    primary: '#422ad5',
    accent: '#00d3bb',
    text: '#18181b',
    neutral: '#ffffff',
    border: 'rgba(66, 42, 213, 0.15)',
    isLight: true,
  },
  dark: {
    primary: '#605dff',
    accent: '#00d3bb',
    text: '#ecf9ff',
    neutral: '#1d232a',
    border: 'rgba(96, 93, 255, 0.3)',
    isLight: false,
  },
  cupcake: {
    primary: '#44ebd3',
    accent: '#f9cbe5',
    text: '#291334',
    neutral: '#faf7f5',
    border: 'rgba(68, 235, 211, 0.3)',
    isLight: true,
  },
  bumblebee: {
    primary: '#fdc700',
    accent: '#ff8904',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(253, 199, 0, 0.3)',
    isLight: true,
  },
  emerald: {
    primary: '#66cc8a',
    accent: '#377cfb',
    text: '#333c4d',
    neutral: '#ffffff',
    border: 'rgba(102, 204, 138, 0.3)',
    isLight: true,
  },
  corporate: {
    primary: '#0082ce',
    accent: '#61738d',
    text: '#181a2a',
    neutral: '#ffffff',
    border: 'rgba(0, 130, 206, 0.25)',
    isLight: true,
  },
  synthwave: {
    primary: '#f861b4',
    accent: '#71d1fe',
    text: '#a1b1ff',
    neutral: '#09002f',
    border: 'rgba(248, 97, 180, 0.3)',
    isLight: false,
  },
  retro: {
    primary: '#ff9fa0',
    accent: '#b7f6cd',
    text: '#793205',
    neutral: '#ece3ca',
    border: 'rgba(121, 50, 5, 0.2)',
    isLight: true,
  },
  cyberpunk: {
    primary: '#ff6596',
    accent: '#00e8ff',
    text: '#000000',
    neutral: '#fff248',
    border: 'rgba(0, 0, 0, 0.35)',
    isLight: true,
  },
  valentine: {
    primary: '#f43098',
    accent: '#ab44ff',
    text: '#c5005a',
    neutral: '#fcf2f8',
    border: 'rgba(244, 48, 152, 0.25)',
    isLight: true,
  },
  halloween: {
    primary: '#ff8f00',
    accent: '#7a00c2',
    text: '#cdcdcd',
    neutral: '#1b1816',
    border: 'rgba(255, 143, 0, 0.3)',
    isLight: false,
  },
  garden: {
    primary: '#fe0075',
    accent: '#8e4162',
    text: '#100f0f',
    neutral: '#e9e7e7',
    border: 'rgba(254, 0, 117, 0.2)',
    isLight: true,
  },
  forest: {
    primary: '#1fb854',
    accent: '#1eb88e',
    text: '#cac9c9',
    neutral: '#1b1717',
    border: 'rgba(31, 184, 84, 0.3)',
    isLight: false,
  },
  aqua: {
    primary: '#13ecf3',
    accent: '#966fb3',
    text: '#b8e6fe',
    neutral: '#1a368b',
    border: 'rgba(19, 236, 243, 0.3)',
    isLight: false,
  },
  lofi: {
    primary: '#0d0d0d',
    accent: '#262626',
    text: '#000000',
    neutral: '#ffffff',
    border: 'rgba(13, 13, 13, 0.25)',
    isLight: true,
  },
  pastel: {
    primary: '#e9d4ff',
    accent: '#feccd2',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(233, 212, 255, 0.4)',
    isLight: true,
  },
  fantasy: {
    primary: '#6d0076',
    accent: '#0075c2',
    text: '#1f2937',
    neutral: '#ffffff',
    border: 'rgba(109, 0, 118, 0.2)',
    isLight: true,
  },
  wireframe: {
    primary: '#d4d4d4',
    accent: '#d4d4d4',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(212, 212, 212, 0.5)',
    isLight: true,
  },
  black: {
    primary: '#3a3a3a',
    accent: '#3a3a3a',
    text: '#d6d6d6',
    neutral: '#000000',
    border: 'rgba(214, 214, 214, 0.15)',
    isLight: false,
  },
  luxury: {
    primary: '#ffffff',
    accent: '#dca54d',
    text: '#dca54d',
    neutral: '#09090b',
    border: 'rgba(220, 165, 77, 0.25)',
    isLight: false,
  },
  dracula: {
    primary: '#ff79c6',
    accent: '#bd93f9',
    text: '#f8f8f3',
    neutral: '#282a36',
    border: 'rgba(189, 147, 249, 0.3)',
    isLight: false,
  },
  cmyk: {
    primary: '#45aeee',
    accent: '#e8488a',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(69, 174, 238, 0.25)',
    isLight: true,
  },
  autumn: {
    primary: '#8c0327',
    accent: '#d59b6b',
    text: '#141414',
    neutral: '#f1f1f1',
    border: 'rgba(140, 3, 39, 0.2)',
    isLight: true,
  },
  business: {
    primary: '#1c4e80',
    accent: '#7c909a',
    text: '#cdcdcd',
    neutral: '#202020',
    border: 'rgba(28, 78, 128, 0.3)',
    isLight: false,
  },
  acid: {
    primary: '#ff00ff',
    accent: '#c8ff00',
    text: '#000000',
    neutral: '#fff7ed',
    border: 'rgba(255, 0, 255, 0.35)',
    isLight: true,
  },
  lemonade: {
    primary: '#419400',
    accent: '#bdc000',
    text: '#151614',
    neutral: '#f8fdef',
    border: 'rgba(65, 148, 0, 0.25)',
    isLight: true,
  },
  night: {
    primary: '#3abdf7',
    accent: '#818cf8',
    text: '#c9cbd0',
    neutral: '#0f172a',
    border: 'rgba(58, 189, 247, 0.3)',
    isLight: false,
  },
  coffee: {
    primary: '#db924c',
    accent: '#11576d',
    text: '#c59f61',
    neutral: '#261b25',
    border: 'rgba(219, 146, 76, 0.25)',
    isLight: false,
  },
  winter: {
    primary: '#394e6a',
    accent: '#463aa2',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(57, 78, 106, 0.25)',
    isLight: true,
  },
  dim: {
    primary: '#9fe88d',
    accent: '#ff7d5d',
    text: '#b2ccd6',
    neutral: '#2a303c',
    border: 'rgba(159, 232, 141, 0.3)',
    isLight: false,
  },
  nord: {
    primary: '#5e81ac',
    accent: '#88c0d0',
    text: '#2e3440',
    neutral: '#eceff4',
    border: 'rgba(94, 129, 172, 0.25)',
    isLight: true,
  },
  sunset: {
    primary: '#ff865b',
    accent: '#fd6f9c',
    text: '#9fb9d0',
    neutral: '#121c22',
    border: 'rgba(255, 134, 91, 0.3)',
    isLight: false,
  },
  abyss: {
    primary: '#bdff00',
    accent: '#cebef4',
    text: '#ffd6a7',
    neutral: '#001e29',
    border: 'rgba(189, 255, 0, 0.3)',
    isLight: false,
  },
  silk: {
    primary: '#1c1c29',
    accent: '#1c1c29',
    text: '#4b4743',
    neutral: '#f7f5f3',
    border: 'rgba(28, 28, 41, 0.2)',
    isLight: true,
  }
}

const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#cd7c32'] // gold, silver, bronze

function getLeaderboard(donations) {
  const map = {}
  donations.forEach((d) => {
    if (d.status !== 'success' || d.is_test) return
    const key = d.sender_name
    if (!map[key]) map[key] = { sender_name: key, total: 0, count: 0 }
    map[key].total += d.amount
    map[key].count += 1
  })
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

export default function LeaderboardOverlay() {
  const { streamerId } = useParams()
  const [searchParams] = useSearchParams()
  const [leaderboard, setLeaderboard] = useState([])

  // Ambil tema dari URL parameter
  const themeParam = searchParams.get('theme') || 'default'
  const themeConfig = THEMES[themeParam] || THEMES.default

  const MEDAL_BG = themeConfig.isLight
    ? ['rgba(251,191,36,0.06)', 'rgba(148,163,184,0.05)', 'rgba(205,124,50,0.05)']
    : ['rgba(251,191,36,0.12)', 'rgba(148,163,184,0.10)', 'rgba(205,124,50,0.10)']

  /* Transparent background */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Fetch + compute leaderboard */
  const computeLeaderboard = useCallback(async () => {
    if (!isSupabaseReady || !supabase || !streamerId) {
      setLeaderboard(getLeaderboard(MOCK_DONATIONS))
      return
    }
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('sender_name,amount,status,is_test')
        .eq('streamer_id', streamerId)
        .eq('status', 'success')
        .eq('is_test', false)
      if (error) throw error
      setLeaderboard(getLeaderboard(data || []))
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setLeaderboard(getLeaderboard(MOCK_DONATIONS))
    }
  }, [streamerId])

  useEffect(() => {
    computeLeaderboard()
  }, [computeLeaderboard])

  /* Realtime subscription */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) return

    const channel = supabase
      .channel(`leaderboard-${streamerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, () => computeLeaderboard())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [streamerId, computeLeaderboard])

  if (!leaderboard.length) return null

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 280,
      background: themeConfig.neutral,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${themeConfig.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${themeConfig.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={themeConfig.isLight ? themeConfig.primary : '#fbbf24'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8m-4-4v4m-2.5-8.5L12 7l4.5 5.5M6 12l6-4.5L18 12" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: themeConfig.isLight ? '#3f3f46' : '#fafafa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Top Donatur
        </span>
      </div>

      {/* List */}
      <div style={{ padding: '6px 0' }}>
        {leaderboard.map((d, i) => (
          <div key={d.sender_name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: i < 3 ? MEDAL_BG[i] : 'transparent',
          }}>
            {/* Rank */}
            <span style={{
              width: 18,
              fontSize: 10,
              fontWeight: 800,
              color: i < 3 ? MEDAL_COLORS[i] : (themeConfig.isLight ? '#71717a' : '#52525b'),
              textAlign: 'center',
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
            }}>
              {i + 1}
            </span>

            {/* Name */}
            <span style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 600,
              color: themeConfig.isLight ? '#18181b' : '#e4e4e7',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {d.sender_name}
            </span>

            {/* Amount */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: i < 3 ? MEDAL_COLORS[i] : themeConfig.accent,
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
            }}>
              {formatRp(d.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AlertOverlay — /overlay/alert/:streamerId
 * OBS Browser Source: popup alert + TTS saat donasi sukses masuk.
 *
 * Mekanisme:
 *  1. Supabase Realtime → listen INSERT (is_test=true, status=success)
 *                       → listen UPDATE (status berubah jadi 'success')
 *  2. Demo mode → localStorage 'storage' event dari Dashboard
 *  3. Alert popup muncul 8 detik lalu dismiss otomatis
 *  4. TTS dibacakan saat alert muncul, dibatalkan saat dismiss
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { useTTS } from '../../hooks/useTTS'
import { MOCK_PROFILE } from '../../lib/mockData'
import { formatRp, truncate } from '../../lib/utils'

const ALERT_MS = 8000

/* ── Peta Tema Lengkap DaisyUI (Konversi dari OKLCH ke HEX) ─── */
const THEMES = {
  default: {
    primary: '#7c3aed',
    accent: '#a78bfa',
    text: '#fafafa',
    neutral: '#18181b',
    border: 'rgba(63, 63, 70, 0.4)',
  },
  light: {
    primary: '#422ad5',
    accent: '#00d3bb',
    text: '#18181b',
    neutral: '#ffffff',
    border: 'rgba(66, 42, 213, 0.15)',
  },
  dark: {
    primary: '#605dff',
    accent: '#00d3bb',
    text: '#ecf9ff',
    neutral: '#1d232a',
    border: 'rgba(96, 93, 255, 0.3)',
  },
  cupcake: {
    primary: '#44ebd3',
    accent: '#f9cbe5',
    text: '#291334',
    neutral: '#faf7f5',
    border: 'rgba(68, 235, 211, 0.3)',
  },
  bumblebee: {
    primary: '#fdc700',
    accent: '#ff8904',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(253, 199, 0, 0.3)',
  },
  emerald: {
    primary: '#66cc8a',
    accent: '#377cfb',
    text: '#333c4d',
    neutral: '#ffffff',
    border: 'rgba(102, 204, 138, 0.3)',
  },
  corporate: {
    primary: '#0082ce',
    accent: '#61738d',
    text: '#181a2a',
    neutral: '#ffffff',
    border: 'rgba(0, 130, 206, 0.25)',
  },
  synthwave: {
    primary: '#f861b4',
    accent: '#71d1fe',
    text: '#a1b1ff',
    neutral: '#09002f',
    border: 'rgba(248, 97, 180, 0.3)',
  },
  retro: {
    primary: '#ff9fa0',
    accent: '#b7f6cd',
    text: '#793205',
    neutral: '#ece3ca',
    border: 'rgba(121, 50, 5, 0.2)',
  },
  cyberpunk: {
    primary: '#ff6596',
    accent: '#00e8ff',
    text: '#000000',
    neutral: '#fff248',
    border: 'rgba(0, 0, 0, 0.35)',
  },
  valentine: {
    primary: '#f43098',
    accent: '#ab44ff',
    text: '#c5005a',
    neutral: '#fcf2f8',
    border: 'rgba(244, 48, 152, 0.25)',
  },
  halloween: {
    primary: '#ff8f00',
    accent: '#7a00c2',
    text: '#cdcdcd',
    neutral: '#1b1816',
    border: 'rgba(255, 143, 0, 0.3)',
  },
  garden: {
    primary: '#fe0075',
    accent: '#8e4162',
    text: '#100f0f',
    neutral: '#e9e7e7',
    border: 'rgba(254, 0, 117, 0.2)',
  },
  forest: {
    primary: '#1fb854',
    accent: '#1eb88e',
    text: '#cac9c9',
    neutral: '#1b1717',
    border: 'rgba(31, 184, 84, 0.3)',
  },
  aqua: {
    primary: '#13ecf3',
    accent: '#966fb3',
    text: '#b8e6fe',
    neutral: '#1a368b',
    border: 'rgba(19, 236, 243, 0.3)',
  },
  lofi: {
    primary: '#0d0d0d',
    accent: '#262626',
    text: '#000000',
    neutral: '#ffffff',
    border: 'rgba(13, 13, 13, 0.25)',
  },
  pastel: {
    primary: '#e9d4ff',
    accent: '#feccd2',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(233, 212, 255, 0.4)',
  },
  fantasy: {
    primary: '#6d0076',
    accent: '#0075c2',
    text: '#1f2937',
    neutral: '#ffffff',
    border: 'rgba(109, 0, 118, 0.2)',
  },
  wireframe: {
    primary: '#d4d4d4',
    accent: '#d4d4d4',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(212, 212, 212, 0.5)',
  },
  black: {
    primary: '#3a3a3a',
    accent: '#3a3a3a',
    text: '#d6d6d6',
    neutral: '#000000',
    border: 'rgba(214, 214, 214, 0.15)',
  },
  luxury: {
    primary: '#ffffff',
    accent: '#dca54d',
    text: '#dca54d',
    neutral: '#09090b',
    border: 'rgba(220, 165, 77, 0.25)',
  },
  dracula: {
    primary: '#ff79c6',
    accent: '#bd93f9',
    text: '#f8f8f3',
    neutral: '#282a36',
    border: 'rgba(189, 147, 249, 0.3)',
  },
  cmyk: {
    primary: '#45aeee',
    accent: '#e8488a',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(69, 174, 238, 0.25)',
  },
  autumn: {
    primary: '#8c0327',
    accent: '#d59b6b',
    text: '#141414',
    neutral: '#f1f1f1',
    border: 'rgba(140, 3, 39, 0.2)',
  },
  business: {
    primary: '#1c4e80',
    accent: '#7c909a',
    text: '#cdcdcd',
    neutral: '#202020',
    border: 'rgba(28, 78, 128, 0.3)',
  },
  acid: {
    primary: '#ff00ff',
    accent: '#c8ff00',
    text: '#000000',
    neutral: '#fff7ed',
    border: 'rgba(255, 0, 255, 0.35)',
  },
  lemonade: {
    primary: '#419400',
    accent: '#bdc000',
    text: '#151614',
    neutral: '#f8fdef',
    border: 'rgba(65, 148, 0, 0.25)',
  },
  night: {
    primary: '#3abdf7',
    accent: '#818cf8',
    text: '#c9cbd0',
    neutral: '#0f172a',
    border: 'rgba(58, 189, 247, 0.3)',
  },
  coffee: {
    primary: '#db924c',
    accent: '#11576d',
    text: '#c59f61',
    neutral: '#261b25',
    border: 'rgba(219, 146, 76, 0.25)',
  },
  winter: {
    primary: '#394e6a',
    accent: '#463aa2',
    text: '#161616',
    neutral: '#ffffff',
    border: 'rgba(57, 78, 106, 0.25)',
  },
  dim: {
    primary: '#9fe88d',
    accent: '#ff7d5d',
    text: '#b2ccd6',
    neutral: '#2a303c',
    border: 'rgba(159, 232, 141, 0.3)',
  },
  nord: {
    primary: '#5e81ac',
    accent: '#88c0d0',
    text: '#2e3440',
    neutral: '#eceff4',
    border: 'rgba(94, 129, 172, 0.25)',
  },
  sunset: {
    primary: '#ff865b',
    accent: '#fd6f9c',
    text: '#9fb9d0',
    neutral: '#121c22',
    border: 'rgba(255, 134, 91, 0.3)',
  },
  abyss: {
    primary: '#bdff00',
    accent: '#cebef4',
    text: '#ffd6a7',
    neutral: '#001e29',
    border: 'rgba(189, 255, 0, 0.3)',
  },
  silk: {
    primary: '#1c1c29',
    accent: '#1c1c29',
    text: '#4b4743',
    neutral: '#f7f5f3',
    border: 'rgba(28, 28, 41, 0.2)',
  }
}

function isThemeLight(hexColor) {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) return false
  const c = hexColor.substring(1)
  const rgb = parseInt(c, 16)
  if (isNaN(rgb)) return false
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 180
}

/* ────────────────────────────────────────────────────────────
   Alert Popup Component (Premium, Handcrafted, Restrained Visuals)
──────────────────────────────────────────────────────────── */
function AlertPopup({ alert, onDismiss, themeConfig }) {
  const [progress, setProgress] = useState(100)
  const [leaving, setLeaving]   = useState(false)

  useEffect(() => {
    if (!alert) return
    setProgress(100)
    setLeaving(false)

    const step = 50
    const dec  = (step / ALERT_MS) * 100
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - dec
        if (next <= 0) {
          clearInterval(interval)
          setLeaving(true)
          setTimeout(onDismiss, 380)
          return 0
        }
        return next
      })
    }, step)

    return () => clearInterval(interval)
  }, [alert, onDismiss])

  if (!alert) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 32,
        left: '50%',
        width: 400,
        maxWidth: '92vw',
        animation: leaving
          ? 'alertDismiss 0.38s ease forwards'
          : 'alertPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        zIndex: 50,
      }}
    >
      {/* Card Panel */}
      <div style={{
        position: 'relative',
        borderRadius: 8,
        background: themeConfig.neutral,
        border: `1px solid ${themeConfig.border}`,
        padding: '16px 18px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
      }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header Row: Sender + Amount in a single clean line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {/* Small vector heart */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: themeConfig.primary, flexShrink: 0 }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <div style={{ fontSize: 13, color: themeConfig.text, fontWeight: 600, display: 'inline', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {alert.sender_name}
                <span style={{ color: '#71717a', fontWeight: 400, marginLeft: 5, marginRight: 5 }}>mengirim</span>
                <span style={{ color: themeConfig.accent, fontFamily: 'Outfit, sans-serif', fontWeight: 750 }}>
                  {formatRp(alert.amount)}
                </span>
              </div>
            </div>

            {/* Test alert badge */}
            {alert.is_test && (
              <span style={{
                fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
                color: '#fbbf24', marginLeft: 8, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>TEST</span>
            )}
          </div>

          {/* Message Row: Left border blockquote design */}
          {alert.message && (
            <div style={{
              borderLeft: `2px solid ${themeConfig.primary}`,
              paddingLeft: 12,
              paddingTop: 2,
              paddingBottom: 2,
              color: isThemeLight(themeConfig.neutral) ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)',
              fontSize: 12.5,
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}>
              "{truncate(alert.message, 150)}"
            </div>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1.5,
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: themeConfig.primary,
            transition: 'none',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   ALERT OVERLAY ROOT
════════════════════════════════════════════════════════════ */
export default function AlertOverlay() {
  const { streamerId } = useParams()
  const [searchParams] = useSearchParams()
  const { speak, stop } = useTTS()
  const [alert, setAlert]       = useState(null)
  const queueRef = useRef([])
  const busyRef  = useRef(false)

  // Ambil tema dari URL parameter
  const themeParam = searchParams.get('theme') || 'default'
  const themeConfig = THEMES[themeParam] || THEMES.default

  /* Transparent background */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Proses antrian alert */
  const processNext = useCallback(() => {
    if (busyRef.current || !queueRef.current.length) return
    const next = queueRef.current.shift()
    busyRef.current = true
    setAlert(next)

    // TTS
    const ttsText = `${next.amount} Rupiah dari ${next.sender_name}. ${next.message ? next.message : ''}`
    speak(ttsText)
  }, [speak])

  const handleNewDonation = useCallback((donation) => {
    queueRef.current.push(donation)
    processNext()
  }, [processNext])

  const handleDismiss = useCallback(() => {
    setAlert(null)
    stop()
    busyRef.current = false
    setTimeout(processNext, 600)
  }, [stop, processNext])

  /* ── Supabase Realtime ─────────────────────────────────── */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) return

    const channel = supabase
      .channel(`alert-overlay-${streamerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, (payload) => {
        if (payload.new.status === 'success') handleNewDonation(payload.new)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, (payload) => {
        if (payload.new.status === 'success' && payload.old?.status !== 'success') {
          handleNewDonation(payload.new)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [streamerId, handleNewDonation])

  /* ── Demo mode: localStorage event dari Dashboard ─────── */
  useEffect(() => {
    if (isSupabaseReady) return

    const handler = (e) => {
      if (e.key === 'nyawer_test_alert' && e.newValue) {
        try {
          handleNewDonation(JSON.parse(e.newValue))
          localStorage.removeItem('nyawer_test_alert')
        } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [handleNewDonation])

  /* ── Demo trigger button (saat tidak ada Supabase) ───── */
  const triggerDemo = () => {
    const demos = [
      { id: Date.now(), sender_name: 'BudiGaming', amount: 50000, message: 'Ayo win bro! Gas terus!', is_test: true },
      { id: Date.now(), sender_name: 'SitiStream', amount: 100000, message: 'Sultan hadir! Jangan kalah!', is_test: true },
      { id: Date.now(), sender_name: 'Anonim', amount: 25000, message: '', is_test: true },
    ]
    handleNewDonation(demos[Math.floor(Math.random() * demos.length)])
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <AlertPopup alert={alert} onDismiss={handleDismiss} themeConfig={themeConfig} />

      {/* Demo button */}
      {!isSupabaseReady && (
        <button
          onClick={triggerDemo}
          style={{
            position: 'absolute',
            top: 16, right: 16,
            background: '#1f1f23',
            border: '1px solid rgba(63,63,70,0.5)',
            borderRadius: 8,
            color: '#e4e4e7',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          title="Klik untuk test alert (mode demo)"
        >
          ▶ Test Alert
        </button>
      )}

      {/* OBS tip */}
      {!isSupabaseReady && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: 6, padding: '4px 10px',
          fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap',
        }}>
          Mode Demo - Set Supabase ENV untuk live data
        </div>
      )}
    </div>
  )
}

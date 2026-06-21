/**
 * AlertOverlay — /overlay/alert/:streamerId
 * OBS Browser Source: popup alert Y2K + TTS saat donasi sukses masuk.
 *
 * Mekanisme:
 *  1. Supabase Realtime → listen INSERT (is_test=true, status=success)
 *                       → listen UPDATE (status berubah jadi 'success')
 *  2. Demo mode → localStorage 'storage' event dari Dashboard
 *  3. Alert popup muncul 8 detik lalu dismiss otomatis
 *  4. TTS dibacakan saat alert muncul, dibatalkan saat dismiss
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { useTTS } from '../../hooks/useTTS'
import { MOCK_PROFILE } from '../../lib/mockData'
import { formatRp, truncate } from '../../lib/utils'

const ALERT_MS = 8000

/* ────────────────────────────────────────────────────────────
   Alert Popup Component (Premium, Handcrafted, Restrained Visuals)
──────────────────────────────────────────────────────────── */
function AlertPopup({ alert, onDismiss }) {
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
      {/* Card Panel (Premium minimal border, flat background) */}
      <div style={{
        position: 'relative',
        borderRadius: 8,
        background: '#18181b',
        border: '1px solid #27272a',
        padding: '16px 18px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
      }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header Row: Sender + Amount in a single clean line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {/* Small vector heart */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#8b5cf6', flexShrink: 0 }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 600, display: 'inline', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {alert.sender_name}
                <span style={{ color: '#71717a', fontWeight: 400, marginLeft: 5, marginRight: 5 }}>mengirim</span>
                <span style={{ color: '#a78bfa', fontFamily: 'Outfit, sans-serif', fontWeight: 750 }}>
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

          {/* Message Row: Left border blockquote design (Editorial look) */}
          {alert.message && (
            <div style={{
              borderLeft: '2px solid rgba(124, 58, 237, 0.4)',
              paddingLeft: 12,
              paddingTop: 2,
              paddingBottom: 2,
              color: '#a1a1aa',
              fontSize: 12.5,
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}>
              "{truncate(alert.message, 150)}"
            </div>
          )}
        </div>

        {/* Bottom Progress Bar: Ultra-thin subtle indicator */}
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
            background: '#7c3aed',
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
  const { speak, stop } = useTTS()
  const [alert, setAlert]       = useState(null)
  const queueRef = useRef([])
  const busyRef  = useRef(false)

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
      <AlertPopup alert={alert} onDismiss={handleDismiss} />

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

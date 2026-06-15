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
   Alert Popup Component (Y2K style)
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
        top: 48,
        left: '50%',
        width: 480,
        maxWidth: '92vw',
        animation: leaving
          ? 'alertDismiss 0.38s ease forwards'
          : 'alertPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        zIndex: 50,
      }}
    >
      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: -2, borderRadius: 28,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(34,211,238,0.5))',
        filter: 'blur(16px)', opacity: 0.8,
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(10,4,28,0.97) 0%, rgba(4,12,28,0.97) 100%)',
        border: '1.5px solid rgba(168,85,247,0.35)',
        boxShadow: '0 0 80px rgba(168,85,247,0.4), 0 0 160px rgba(34,211,238,0.1), inset 0 0 40px rgba(168,85,247,0.04)',
      }}>
        {/* Top stripe */}
        <div style={{
          height: 3, width: '100%',
          background: 'linear-gradient(90deg,#7c3aed,#a855f7,#22d3ee,#a855f7,#7c3aed)',
          backgroundSize: '200% auto',
          animation: 'shimmer 2s linear infinite',
        }} />

        <div style={{ padding: '20px 28px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#22d3ee)',
              boxShadow: '0 0 24px rgba(168,85,247,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              animation: 'float 3s ease-in-out infinite',
            }}>
              💜
            </div>
            <div>
              <p style={{
                fontSize: 10, fontFamily: 'Outfit,sans-serif', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                background: 'linear-gradient(135deg,#a855f7,#22d3ee)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 3,
              }}>
                ✦ Nyawer Baru Masuk ✦
              </p>
              <p style={{
                fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.15,
                background: 'linear-gradient(135deg,#ffffff 0%,#c084fc 50%,#22d3ee 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                HORE! {alert.sender_name}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600 }}>nyawer</span>
            <span style={{
              fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 40, lineHeight: 1,
              background: 'linear-gradient(135deg,#a855f7,#22d3ee)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.7))',
            }}>
              {formatRp(alert.amount)}
            </span>
            {alert.is_test && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)',
                color: '#fbbf24',
              }}>TEST</span>
            )}
          </div>

          {/* Message */}
          {alert.message && (
            <div style={{
              borderRadius: 16, padding: '12px 16px', marginBottom: 16,
              background: 'rgba(168,85,247,0.07)',
              border: '1px solid rgba(168,85,247,0.15)',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 14, fontStyle: 'italic', lineHeight: 1.5,
            }}>
              "{truncate(alert.message, 150)}"
            </div>
          )}

          {/* Progress bar */}
          <div style={{
            height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#7c3aed,#a855f7,#22d3ee)',
              transition: 'none',
            }} />
          </div>
        </div>

        {/* Bottom stripe */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,#22d3ee,#a855f7)', opacity: 0.4 }} />
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
  const queueRef = useRef([])     // antrian jika beberapa donasi datang sekaligus
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
    const ttsText = [
      `${next.sender_name} nyawer ${formatRp(next.amount).replace('Rp ', '')} Rupiah`,
      next.message ? `, pesannya: ${next.message}` : '',
    ].join('')
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
    // Cek apakah ada alert berikutnya
    setTimeout(processNext, 600)
  }, [stop, processNext])

  /* ── Supabase Realtime ─────────────────────────────────── */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) return

    const channel = supabase
      .channel(`alert-overlay-${streamerId}`)
      // INSERT: test alert (status='success' langsung)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, (payload) => {
        if (payload.new.status === 'success') handleNewDonation(payload.new)
      })
      // UPDATE: donasi real berubah dari 'pending' → 'success'
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
    if (isSupabaseReady) return // hanya aktif di demo mode

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
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            letterSpacing: '0.05em',
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
          background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 14px',
          fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
        }}>
          Mode Demo — Set Supabase ENV untuk live data
        </div>
      )}
    </div>
  )
}

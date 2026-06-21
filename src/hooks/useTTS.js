import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook untuk Text-to-Speech & Sound Alerts.
 * Menggunakan Web Audio API untuk chime instan (bel),
 * dan Local Vite Proxy Server (/api/tts) untuk bypass 100% pemblokiran CORS & Referrer.
 *
 * @returns {{ speak(text, lang?): void, stop(): void }}
 */
export function useTTS() {
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const utteranceRef = useRef(null)
  const audioContextRef = useRef(null)

  // Web Audio API Synth Chime
  const playSystemChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime

      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)
      gain1.gain.setValueAtTime(0.15, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1320, now)
      gain2.gain.setValueAtTime(0.08, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1.0)
      osc2.stop(now + 0.7)
    } catch (e) {
      console.warn('Gagal memutar system chime:', e)
    }
  }, [])

  // Fungsi stop
  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (e) {}
      audioRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.resume()
      window.speechSynthesis.cancel()
    }

    if (utteranceRef.current) {
      utteranceRef.current.onend = null
      utteranceRef.current.onerror = null
      utteranceRef.current = null
    }
  }, [])

  // Fungsi utama speak menggunakan Local Vite Server Proxy
  const speak = useCallback(
    (text, lang = 'id') => {
      stop()
      playSystemChime()

      // Tunggu 500ms setelah bel berbunyi
      setTimeout(() => {
        // Hilangkan titik desimal/ribuan agar dibaca lancar sebagai angka
        const cleanText = text.replace(/(\d+)\.(\d+)/g, '$1$2')
        const safeText = cleanText.substring(0, 180)

        // Panggil endpoint proxy lokal kita
        const localProxyUrl = `/api/tts?lang=${lang}&text=${encodeURIComponent(safeText)}`

        try {
          const audio = new Audio(localProxyUrl)
          audioRef.current = audio

          audio.play()
            .then(() => {
              console.log('TTS berhasil diputar via Local Vite Proxy.')
            })
            .catch((playErr) => {
              console.warn('Local Proxy gagal diputar, mencoba local SpeechSynthesis...', playErr)
              triggerSpeechSynthesisFallback(text)
            })
        } catch (err) {
          console.warn('Gagal memutar audio via Local Proxy, mencoba local SpeechSynthesis...', err)
          triggerSpeechSynthesisFallback(text)
        }
      }, 500)
    },
    [stop, playSystemChime]
  )

  // Fallback ke Speech Synthesis Lokal jika server offline
  const triggerSpeechSynthesisFallback = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.resume()

    try {
      const utter = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utter

      const voices = window.speechSynthesis.getVoices()
      const idVoice = voices.find(
        (v) => v.lang.startsWith('id') || v.lang.includes('ID')
      )

      if (idVoice) {
        utter.voice = idVoice
        utter.lang = 'id-ID'
      } else {
        const defaultVoice = voices.find((v) => v.default) || voices[0]
        if (defaultVoice) {
          utter.voice = defaultVoice
          utter.lang = defaultVoice.lang
        }
      }

      utter.rate = 0.95
      utter.pitch = 1.0
      utter.volume = 1.0

      utter.onend = () => stop()
      utter.onerror = () => stop()

      window.speechSynthesis.speak(utter)
    } catch (e) {
      console.error('Semua metode TTS gagal:', e)
    }
  }

  // Unlock AudioContext browser
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioCtx()
          }
          const ctx = audioContextRef.current
          if (ctx.state === 'suspended') {
            ctx.resume()
          }
        }
      } catch (e) {}
    }

    window.addEventListener('click', unlock, { once: true, passive: true })
    window.addEventListener('mousedown', unlock, { once: true, passive: true })
    window.addEventListener('touchstart', unlock, { once: true, passive: true })

    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('mousedown', unlock)
      window.removeEventListener('touchstart', unlock)
      stop()
    }
  }, [stop])

  return { speak, stop }
}

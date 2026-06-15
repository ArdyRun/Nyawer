import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook untuk Text-to-Speech menggunakan Web Speech API.
 * Mendukung bahasa Indonesia (id-ID) secara default.
 *
 * @returns {{ speak(text, lang?): void, stop(): void }}
 */
export function useTTS() {
  const timerRef = useRef(null)

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
    window.speechSynthesis?.cancel()
  }, [])

  const speak = useCallback(
    (text, lang = 'id-ID') => {
      if (!window.speechSynthesis) return
      stop()

      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 0.9
      utter.pitch = 1.05
      utter.volume = 1

      // Workaround Chrome bug: speech stops after ~15s on long text
      timerRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(timerRef.current)
          return
        }
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }, 10_000)

      utter.onend = () => clearInterval(timerRef.current)
      utter.onerror = () => clearInterval(timerRef.current)

      window.speechSynthesis.speak(utter)
    },
    [stop]
  )

  // Bersihkan saat komponen unmount
  useEffect(() => () => stop(), [stop])

  return { speak, stop }
}

import { useState, useCallback } from 'react'

let _counter = 0

/**
 * Hook untuk mengelola antrian toast notification.
 *
 * @returns {{ toasts, addToast, removeToast }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ message, type = 'success', duration = 3500 }) => {
      const id = ++_counter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    },
    []
  )

  return { toasts, addToast, removeToast }
}

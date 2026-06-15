import { useEffect, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

/**
 * Subscribe ke Supabase Realtime postgres_changes (INSERT).
 * Tidak melakukan apa-apa jika Supabase belum dikonfigurasi.
 *
 * @param {object} opts
 * @param {string}        opts.table    - Nama tabel yang di-listen
 * @param {string|null}   opts.filter   - Filter Supabase, contoh: "streamer_id=eq.uuid"
 * @param {function}      opts.onInsert - Callback dipanggil saat ada INSERT baru (payload)
 */
export function useRealtime({ table, filter = null, onInsert }) {
  // Simpan callback di ref agar tidak perlu re-subscribe saat callback berubah
  const cbRef = useRef(onInsert)
  cbRef.current = onInsert

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return

    const config = { event: 'INSERT', schema: 'public', table }
    if (filter) config.filter = filter

    const channelName = `rt-${table}-${filter ?? 'all'}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, (payload) => cbRef.current?.(payload))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter]) // hanya re-subscribe jika tabel/filter berubah
}

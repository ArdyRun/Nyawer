import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * true jika env vars Supabase sudah dikonfigurasi dengan benar.
 * Jika false, semua operasi DB akan menggunakan mock data.
 */
export const isSupabaseReady = Boolean(
  url && key && !url.includes('your-project-id')
)

/** Supabase client (null jika belum dikonfigurasi) */
export const supabase = isSupabaseReady ? createClient(url, key) : null

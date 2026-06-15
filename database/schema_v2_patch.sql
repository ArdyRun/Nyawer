-- ============================================================
-- NYAWER — Schema V2 Patch
-- Jalankan SETELAH schema.sql (schema pertama sudah ada)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tambah kolom is_test ke tabel donations
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.donations.is_test
  IS 'true = donasi dummy dari tombol "Uji Coba Alert" di Dashboard. Tidak dihitung ke statistik pendapatan.';


-- ─────────────────────────────────────────────────────────────
-- 2. Update Generated Column amount_received (jika perlu ulang)
--    PostgreSQL 14+ mendukung perubahan GENERATED ALWAYS col.
--    Jika error, abaikan (kolom sudah benar).
-- ─────────────────────────────────────────────────────────────
-- (Tidak perlu diubah, sudah benar dari schema v1)


-- ─────────────────────────────────────────────────────────────
-- 3. Update RLS Policy: izinkan streamer INSERT test donation
--    dengan status='success' langsung (untuk tombol Uji Coba)
-- ─────────────────────────────────────────────────────────────

-- Drop existing INSERT policy lalu buat ulang yang lebih lengkap
DROP POLICY IF EXISTS "donations: anyone can insert" ON public.donations;

-- Policy baru: publik bisa insert HANYA dengan status 'pending'
CREATE POLICY "donations: public can insert pending"
  ON public.donations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND is_test = false
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = donations.streamer_id
    )
  );

-- Policy baru: streamer bisa insert test alert (status='success', is_test=true)
CREATE POLICY "donations: streamer can insert test alert"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_test = true
    AND status = 'success'
    AND auth.uid() = streamer_id       -- hanya untuk streamer sendiri
  );


-- ─────────────────────────────────────────────────────────────
-- 4. Update view streamer_stats — excludes is_test donations
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.streamer_stats AS
SELECT
  p.id                                                                    AS streamer_id,
  p.username,
  p.display_name,
  COUNT(d.id)   FILTER (WHERE d.status = 'success' AND d.is_test = false) AS total_donations,
  COALESCE(SUM(d.amount)          FILTER (WHERE d.status = 'success' AND d.is_test = false), 0) AS total_gross,
  COALESCE(SUM(d.amount_received) FILTER (WHERE d.status = 'success' AND d.is_test = false), 0) AS total_received,
  MAX(d.created_at)               FILTER (WHERE d.status = 'success' AND d.is_test = false) AS last_donation_at
FROM public.profiles p
LEFT JOIN public.donations d ON d.streamer_id = p.id
GROUP BY p.id, p.username, p.display_name;

COMMENT ON VIEW public.streamer_stats
  IS 'Statistik donasi per streamer — donasi is_test DIKECUALIKAN dari perhitungan.';


-- ─────────────────────────────────────────────────────────────
-- 5. Update view recent_successful_donations — excludes is_test
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.recent_successful_donations AS
SELECT
  d.id,
  d.streamer_id,
  p.username          AS streamer_username,
  p.display_name      AS streamer_display_name,
  d.sender_name,
  d.amount,
  d.amount_received,
  d.message,
  d.is_test,
  d.created_at
FROM public.donations d
JOIN public.profiles p ON p.id = d.streamer_id
WHERE d.status = 'success'
ORDER BY d.created_at DESC;

COMMENT ON VIEW public.recent_successful_donations
  IS 'Semua donasi sukses (termasuk is_test). Filter is_test di sisi aplikasi jika perlu.';


-- ─────────────────────────────────────────────────────────────
-- ✅ PATCH SELESAI
-- ─────────────────────────────────────────────────────────────
-- Verifikasi:
--   SELECT * FROM public.donations LIMIT 5;  -- pastikan kolom is_test ada
--   SELECT * FROM public.streamer_stats;     -- pastikan view terupdate
-- ─────────────────────────────────────────────────────────────

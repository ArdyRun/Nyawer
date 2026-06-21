-- ============================================================
-- NYAWER — Schema V2 Patch (Consolidated)
-- Jalankan skrip ini secara utuh di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tambah kolom is_test ke tabel donations
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.donations.is_test
  IS 'true = donasi dummy dari tombol "Uji Coba Alert" di Dashboard. Tidak dihitung ke statistik pendapatan.';


-- 2. Hapus view yang lama agar strukturnya bisa diperbarui tanpa konflik
DROP VIEW IF EXISTS public.recent_successful_donations;
DROP VIEW IF EXISTS public.streamer_stats;


-- 3. Buat kembali view recent_successful_donations dengan kolom is_test
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


-- 4. Buat kembali view streamer_stats — mengecualikan donasi is_test
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


-- 5. Update RLS Policy: izinkan publik INSERT dengan status 'success' atau 'pending'
--    langsung (karena bypass payment gateway)
DROP POLICY IF EXISTS "donations: anyone can insert" ON public.donations;
DROP POLICY IF EXISTS "donations: public can insert pending" ON public.donations;
DROP POLICY IF EXISTS "donations: public can insert success direct" ON public.donations;
DROP POLICY IF EXISTS "donations: streamer can insert test alert" ON public.donations;

CREATE POLICY "donations: public can insert success direct"
  ON public.donations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (status = 'success' OR status = 'pending')
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
    AND auth.uid() = streamer_id
  );

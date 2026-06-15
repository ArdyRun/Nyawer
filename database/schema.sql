-- ============================================================
-- NYAWER — Supabase PostgreSQL Schema
-- Version  : 1.0.0
-- Author   : Nyawer Dev Team
-- ============================================================
-- Urutan eksekusi:
--   1. Types / Enums
--   2. Tables
--   3. Indexes
--   4. Functions & Triggers
--   5. Row Level Security (RLS) Policies
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS (aktifkan jika belum ada)
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram index untuk search username


-- ─────────────────────────────────────────────────────────────
-- 1. CUSTOM TYPES / ENUMS
-- ─────────────────────────────────────────────────────────────

-- Status pembayaran donasi
CREATE TYPE donation_status AS ENUM ('pending', 'success', 'failed', 'expired');

-- Catatan:
--   pending  → donasi dibuat, menunggu pembayaran
--   success  → pembayaran dikonfirmasi
--   failed   → pembayaran gagal / ditolak
--   expired  → melewati batas waktu pembayaran


-- ─────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────┐
-- │  TABLE: profiles                        │
-- │  Satu baris per user (streamer/viewer)  │
-- └─────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key — sama persis dengan auth.users.id milik Supabase
    id                  UUID            PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,

    -- URL slug unik: nyawer.id/{username}
    username            TEXT            NOT NULL UNIQUE,

    -- Nama tampil di halaman publik
    display_name        TEXT            NOT NULL DEFAULT '',

    -- URL foto profil (bisa dari Supabase Storage atau URL eksternal)
    avatar_url          TEXT,

    -- Minimum nominal donasi (rupiah), default Rp 10.000
    min_donation        INTEGER         NOT NULL DEFAULT 10000 CHECK (min_donation >= 1000),

    -- Bio singkat streamer (opsional, maks 280 karakter)
    bio                 TEXT            CHECK (char_length(bio) <= 280),

    -- Metadata waktu
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles                IS 'Data publik profil streamer/user, satu baris per auth.users.';
COMMENT ON COLUMN public.profiles.id             IS 'FK ke auth.users.id — dibuat otomatis saat user register.';
COMMENT ON COLUMN public.profiles.username       IS 'Slug unik untuk URL halaman donasi: nyawer.id/{username}.';
COMMENT ON COLUMN public.profiles.min_donation   IS 'Minimum donasi dalam Rupiah. Tidak boleh kurang dari Rp 1.000.';


-- ┌─────────────────────────────────────────┐
-- │  TABLE: donations                       │
-- │  Setiap transaksi donasi                │
-- └─────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.donations (
    -- Primary key UUID (lebih aman daripada serial integer)
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Pemilik / streamer yang menerima donasi
    streamer_id         UUID            NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,

    -- Nama pengirim (tidak harus user terdaftar — viewer bisa anonim)
    sender_name         TEXT            NOT NULL DEFAULT 'Anonim' CHECK (char_length(sender_name) >= 1),

    -- Nominal donasi dalam Rupiah (integer, bukan desimal)
    amount              INTEGER         NOT NULL CHECK (amount >= 1000),

    -- Pesan/sapaan dari viewer ke streamer
    message             TEXT            CHECK (char_length(message) <= 300),

    -- Status pembayaran (gunakan enum di atas)
    status              donation_status NOT NULL DEFAULT 'pending',

    -- Referensi ID dari payment gateway (Midtrans order_id, dll.)
    payment_ref         TEXT,

    -- Jumlah yang diterima streamer setelah potongan 4%
    -- Dihitung otomatis oleh trigger di bawah
    amount_received     INTEGER         GENERATED ALWAYS AS (FLOOR(amount * 0.96)) STORED,

    -- Metadata waktu
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.donations                  IS 'Rekam jejak setiap transaksi donasi ke streamer.';
COMMENT ON COLUMN public.donations.amount           IS 'Nominal donasi bruto (sebelum potongan) dalam Rupiah.';
COMMENT ON COLUMN public.donations.amount_received  IS 'Nominal bersih yang diterima streamer (96% dari amount), dihitung otomatis.';
COMMENT ON COLUMN public.donations.payment_ref      IS 'Order ID / reference dari payment gateway untuk rekonsiliasi.';
COMMENT ON COLUMN public.donations.status           IS 'pending → success setelah webhook konfirmasi dari payment gateway.';


-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────

-- Index untuk lookup profil via username (paling sering dipakai)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
    ON public.profiles (LOWER(username));   -- case-insensitive uniqueness

-- Index trigram untuk pencarian username (autocomplete/search)
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
    ON public.profiles USING GIN (username gin_trgm_ops);

-- Index untuk query donasi per streamer (dashboard utama)
CREATE INDEX IF NOT EXISTS idx_donations_streamer_id
    ON public.donations (streamer_id);

-- Index untuk filter donasi berdasarkan status
CREATE INDEX IF NOT EXISTS idx_donations_status
    ON public.donations (status);

-- Index komposit: donasi per streamer urut waktu (dashboard + alert OBS)
CREATE INDEX IF NOT EXISTS idx_donations_streamer_created
    ON public.donations (streamer_id, created_at DESC);

-- Index untuk payment_ref (webhook lookup dari payment gateway)
CREATE INDEX IF NOT EXISTS idx_donations_payment_ref
    ON public.donations (payment_ref)
    WHERE payment_ref IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- 4. FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────

-- 4a. Auto-update kolom `updated_at` saat row diubah
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 4b. Auto-create profile saat user baru mendaftar via Supabase Auth
--     Trigger ini berjalan di schema auth, tapi fungsinya di public.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                    -- Penting: agar bisa insert ke public.profiles
SET search_path = public
AS $$
DECLARE
    _username TEXT;
BEGIN
    -- Buat username awal dari bagian sebelum '@' di email
    -- Contoh: "budi@gmail.com" → "budi"
    _username := LOWER(
        REGEXP_REPLACE(
            SPLIT_PART(NEW.email, '@', 1),
            '[^a-z0-9_]', '_', 'g'     -- ganti karakter tidak valid dengan underscore
        )
    );

    -- Jika username sudah ada, tambahkan 4 digit random di belakang
    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = _username) THEN
        _username := _username || '_' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        _username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', _username),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;   -- Idempoten: abaikan jika sudah ada

    RETURN NEW;
END;
$$;

-- Pasang trigger ke auth.users (dijalankan setelah INSERT)
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4c. Validasi: amount donasi tidak boleh kurang dari min_donation streamer
CREATE OR REPLACE FUNCTION public.validate_donation_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    _min_donation INTEGER;
BEGIN
    SELECT min_donation INTO _min_donation
    FROM public.profiles
    WHERE id = NEW.streamer_id;

    IF NEW.amount < _min_donation THEN
        RAISE EXCEPTION
            'Jumlah donasi (%) kurang dari minimum donasi streamer (%)',
            NEW.amount, _min_donation
        USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_validate_donation_amount
    BEFORE INSERT ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.validate_donation_amount();


-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────

-- ── 5a. TABLE: profiles ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [POLICY 1] Siapa pun (termasuk anonymous / anon role) bisa membaca semua profil
--            → Dibutuhkan untuk halaman publik nyawer.id/{username}
CREATE POLICY "profiles: public can read all"
    ON public.profiles
    FOR SELECT
    TO anon, authenticated           -- berlaku untuk user tidak login maupun yang sudah login
    USING (true);                    -- tidak ada filter → semua baris terlihat

-- [POLICY 2] Hanya pemilik akun yang bisa UPDATE profilnya sendiri
CREATE POLICY "profiles: owner can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated                 -- hanya user yang sudah login
    USING (
        auth.uid() = id              -- id profil harus sama dengan user yang sedang login
    )
    WITH CHECK (
        auth.uid() = id              -- pastikan tidak bisa ganti id ke milik orang lain
    );

-- [POLICY 3] Hanya pemilik yang bisa DELETE profilnya sendiri
--            (Opsional — lebih aman daripada tidak ada policy ini sama sekali)
CREATE POLICY "profiles: owner can delete own profile"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);


-- ── 5b. TABLE: donations ────────────────────────────────────

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- [POLICY 1] Siapa pun (termasuk anonymous) bisa INSERT donasi baru
--            → Viewer tidak perlu login untuk donasi
--            WITH CHECK memastikan:
--              a) status harus 'pending' saat insert (tidak boleh langsung 'success')
--              b) Viewer tidak bisa set streamer_id sembarangan (harus profil yang valid)
CREATE POLICY "donations: anyone can insert"
    ON public.donations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'pending'                              -- Harus mulai dari pending
        AND EXISTS (                                    -- streamer_id harus ada di profiles
            SELECT 1 FROM public.profiles
            WHERE id = donations.streamer_id
        )
    );

-- [POLICY 2] Streamer hanya bisa SELECT donasi yang masuk ke akun mereka sendiri
--            → Dashboard streamer: melihat list & history donasi masuk
CREATE POLICY "donations: streamer can read own donations"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = streamer_id    -- hanya donasi yang ditujukan ke streamer ini
    );

-- [POLICY 3] Hanya service_role (backend/webhook) yang bisa UPDATE status donasi
--            → Penting! Viewer/streamer tidak boleh mengubah status sendiri.
--            Policy ini menggunakan TO service_role, yang TIDAK bisa diakses dari client.
--            Webhook payment gateway (Midtrans, dll.) akan menggunakan SUPABASE_SERVICE_ROLE_KEY.
CREATE POLICY "donations: service role can update status"
    ON public.donations
    FOR UPDATE
    TO service_role                 -- hanya backend server, bukan client
    USING (true)
    WITH CHECK (true);

-- [POLICY 4] Streamer tidak bisa DELETE donasi (audit trail harus terjaga)
--            Tidak ada policy DELETE → secara default semua ditolak (RLS enabled).


-- ─────────────────────────────────────────────────────────────
-- 6. GRANTS (Izin akses ke role Supabase)
-- ─────────────────────────────────────────────────────────────

-- Izinkan anon & authenticated mengakses tabel publik
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT          ON public.profiles  TO anon, authenticated;
GRANT UPDATE          ON public.profiles  TO authenticated;

GRANT SELECT          ON public.donations TO authenticated;
GRANT INSERT          ON public.donations TO anon, authenticated;

-- service_role sudah punya full access by default di Supabase,
-- tapi eksplisit lebih aman:
GRANT ALL             ON public.profiles  TO service_role;
GRANT ALL             ON public.donations TO service_role;


-- ─────────────────────────────────────────────────────────────
-- 7. REALTIME (untuk OBS Alert real-time)
-- ─────────────────────────────────────────────────────────────

-- Tambahkan tabel donations ke Supabase Realtime publication
-- agar bisa subscribe via supabase.channel() dari frontend/OBS widget
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;


-- ─────────────────────────────────────────────────────────────
-- 8. VIEWS (Helper untuk query umum)
-- ─────────────────────────────────────────────────────────────

-- View: Donasi sukses terbaru (untuk leaderboard / thank-you wall)
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
    d.created_at
FROM public.donations d
JOIN public.profiles  p ON p.id = d.streamer_id
WHERE d.status = 'success'
ORDER BY d.created_at DESC;

COMMENT ON VIEW public.recent_successful_donations
    IS 'Donasi sukses terbaru, berguna untuk OBS thank-you wall dan leaderboard publik.';

-- View: Statistik per streamer (total donasi masuk)
CREATE OR REPLACE VIEW public.streamer_stats AS
SELECT
    p.id                                            AS streamer_id,
    p.username,
    p.display_name,
    COUNT(d.id)                                     AS total_donations,
    COALESCE(SUM(d.amount)        FILTER (WHERE d.status = 'success'), 0) AS total_gross,
    COALESCE(SUM(d.amount_received) FILTER (WHERE d.status = 'success'), 0) AS total_received,
    MAX(d.created_at)             FILTER (WHERE d.status = 'success') AS last_donation_at
FROM public.profiles p
LEFT JOIN public.donations d ON d.streamer_id = p.id
GROUP BY p.id, p.username, p.display_name;

COMMENT ON VIEW public.streamer_stats
    IS 'Agregasi statistik donasi per streamer. Gunakan untuk halaman dashboard.';


-- ─────────────────────────────────────────────────────────────
-- ✅ SCHEMA SELESAI
-- ─────────────────────────────────────────────────────────────
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh isi file ini
--   3. Klik "Run" (atau Ctrl+Enter)
--   4. Cek tabel di Table Editor → public
-- ─────────────────────────────────────────────────────────────

-- ============================================================
-- NYAWER — Schema V3 Patch (Custom Authentication Table & RPC)
-- Jalankan skrip ini secara utuh di SQL Editor Supabase Anda
-- ============================================================

-- 1. Hapus trigger lama bawaan Supabase Auth agar tidak mengganggu sistem custom user kita
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Bersihkan view dan tabel lama agar strukturnya bisa dibangun ulang tanpa konflik
DROP VIEW IF EXISTS public.recent_successful_donations;
DROP VIEW IF EXISTS public.streamer_stats;
DROP TABLE IF EXISTS public.donations;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.user_sessions;
DROP TABLE IF EXISTS public.users;

-- 3. Aktifkan ekstensi pgcrypto untuk hashing password (bcrypt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 4. Buat tabel users kustom untuk menggantikan auth.users milik Supabase
CREATE TABLE public.users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT            NOT NULL UNIQUE,
    password_hash       TEXT            NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Tabel kredensial user untuk kustom autentikasi (bypass Supabase Auth).';

-- 5. Buat tabel user_sessions untuk menyimpan token sesi aktif
CREATE TABLE public.user_sessions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token               UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

COMMENT ON TABLE public.user_sessions IS 'Menyimpan token sesi aktif untuk autentikasi RPC di client-side.';

-- 6. Buat tabel profiles baru yang merujuk ke users kustom
CREATE TABLE public.profiles (
    id                  UUID            PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    username            TEXT            NOT NULL UNIQUE,
    display_name        TEXT            NOT NULL DEFAULT '',
    avatar_url          TEXT,
    min_donation        INTEGER         NOT NULL DEFAULT 10000 CHECK (min_donation >= 1000),
    bio                 TEXT            CHECK (char_length(bio) <= 280),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 7. Buat tabel donations baru
CREATE TABLE public.donations (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name         TEXT            NOT NULL DEFAULT 'Anonim' CHECK (char_length(sender_name) >= 1),
    amount              INTEGER         NOT NULL CHECK (amount >= 1000),
    message             TEXT            CHECK (char_length(message) <= 300),
    status              TEXT            NOT NULL DEFAULT 'pending',
    payment_ref         TEXT,
    is_test             BOOLEAN         NOT NULL DEFAULT false,
    amount_received     INTEGER         GENERATED ALWAYS AS (FLOOR(amount * 0.96)) STORED,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 8. Buat Index untuk mempercepat pencarian data
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_donations_streamer_id ON public.donations (streamer_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_streamer_created ON public.donations (streamer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_payment_ref ON public.donations (payment_ref) WHERE payment_ref IS NOT NULL;

-- 9. Konfigurasi trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Buat View statistik dan donasi terbaru
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

-- 11. Konfigurasi RLS (Row Level Security) untuk keamanan
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: public can read all" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "donations: public can read all" ON public.donations FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "donations: public can insert success direct"
  ON public.donations FOR INSERT TO anon, authenticated
  WITH CHECK (
    (status = 'success' OR status = 'pending')
    AND is_test = false
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = donations.streamer_id)
  );

-- Daftarkan tabel donasi ke realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 12. RPC FUNCTIONS (SECURITY DEFINER API)
-- ============================================================

-- 12a. REGISTER USER RPC
CREATE OR REPLACE FUNCTION public.register_user(
    p_email TEXT,
    p_password TEXT,
    p_display_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_token UUID;
    v_profile RECORD;
BEGIN
    p_email := LOWER(TRIM(p_email));

    IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
        RETURN json_build_object('success', false, 'message', 'Email sudah terdaftar.');
    END IF;

    INSERT INTO public.users (email, password_hash)
    VALUES (p_email, crypt(p_password, gen_salt('bf', 8)))
    RETURNING id INTO v_user_id;

    v_username := LOWER(REGEXP_REPLACE(SPLIT_PART(p_email, '@', 1), '[^a-z0-9_]', '_', 'g'));
    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = v_username) THEN
        v_username := v_username || '_' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    END IF;

    INSERT INTO public.profiles (id, username, display_name, min_donation)
    VALUES (v_user_id, v_username, COALESCE(p_display_name, v_username), 10000);

    INSERT INTO public.user_sessions (user_id)
    VALUES (v_user_id)
    RETURNING token INTO v_token;

    SELECT * FROM public.profiles WHERE id = v_user_id INTO v_profile;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object('id', v_user_id, 'email', p_email),
        'profile', row_to_json(v_profile),
        'session_token', v_token
    );
END;
$$;


-- 12b. LOGIN USER RPC
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_db_password_hash TEXT;
    v_token UUID;
    v_profile RECORD;
BEGIN
    p_email := LOWER(TRIM(p_email));

    SELECT id, password_hash FROM public.users WHERE email = p_email INTO v_user_id, v_db_password_hash;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Email atau password salah.');
    END IF;

    IF v_db_password_hash = crypt(p_password, v_db_password_hash) THEN
        INSERT INTO public.user_sessions (user_id)
        VALUES (v_user_id)
        RETURNING token INTO v_token;

        SELECT * FROM public.profiles WHERE id = v_user_id INTO v_profile;

        RETURN json_build_object(
            'success', true,
            'user', json_build_object('id', v_user_id, 'email', p_email),
            'profile', row_to_json(v_profile),
            'session_token', v_token
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Email atau password salah.');
    END IF;
END;
$$;


-- 12c. LOGOUT USER RPC
CREATE OR REPLACE FUNCTION public.logout_user(
    p_session_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE token = p_session_token;
    RETURN true;
END;
$$;


-- 12d. GET CURRENT USER PROFILE RPC
CREATE OR REPLACE FUNCTION public.get_current_user_profile(
    p_session_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_profile RECORD;
BEGIN
    SELECT s.user_id, u.email
    FROM public.user_sessions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.token = p_session_token AND s.expires_at > NOW()
    INTO v_user_id, v_email;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi kedaluwarsa atau tidak valid.');
    END IF;

    SELECT * FROM public.profiles WHERE id = v_user_id INTO v_profile;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object('id', v_user_id, 'email', v_email),
        'profile', row_to_json(v_profile)
    );
END;
$$;


-- 12e. UPDATE PROFILE SECURE RPC
CREATE OR REPLACE FUNCTION public.update_profile_secure(
    p_session_token UUID,
    p_display_name TEXT,
    p_username TEXT,
    p_bio TEXT,
    p_min_donation INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id FROM public.user_sessions WHERE token = p_session_token AND expires_at > NOW() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    p_username := LOWER(REGEXP_REPLACE(TRIM(p_username), '[^a-z0-9_]', '', 'g'));

    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = p_username AND id != v_user_id) THEN
        RETURN json_build_object('success', false, 'message', 'Username sudah digunakan oleh orang lain.');
    END IF;

    UPDATE public.profiles
    SET
        display_name = COALESCE(p_display_name, display_name),
        username = COALESCE(p_username, username),
        bio = p_bio,
        min_donation = COALESCE(p_min_donation, min_donation)
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Profil berhasil diperbarui.');
END;
$$;


-- 12f. GET MY DONATIONS RPC
CREATE OR REPLACE FUNCTION public.get_my_donations(
    p_session_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_donations JSON;
BEGIN
    SELECT user_id FROM public.user_sessions WHERE token = p_session_token AND expires_at > NOW() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    SELECT json_agg(t) FROM (
        SELECT id, streamer_id, sender_name, amount, message, status, is_test, created_at
        FROM public.donations
        WHERE streamer_id = v_user_id
        ORDER BY created_at DESC
    ) t INTO v_donations;

    RETURN json_build_object(
        'success', true,
        'donations', COALESCE(v_donations, '[]'::json)
    );
END;
$$;


-- 12g. INSERT TEST DONATION SECURE RPC
CREATE OR REPLACE FUNCTION public.insert_test_donation(
    p_session_token UUID,
    p_amount INTEGER,
    p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_donation_id UUID;
    v_new_donation RECORD;
BEGIN
    SELECT user_id FROM public.user_sessions WHERE token = p_session_token AND expires_at > NOW() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    INSERT INTO public.donations (streamer_id, sender_name, amount, message, status, is_test)
    VALUES (v_user_id, 'Uji Coba 🎮', COALESCE(p_amount, 50000), COALESCE(p_message, 'Ini adalah uji coba alert Nyawer!'), 'success', true)
    RETURNING id INTO v_donation_id;

    SELECT * FROM public.donations WHERE id = v_donation_id INTO v_new_donation;

    RETURN json_build_object(
        'success', true,
        'donation', row_to_json(v_new_donation)
    );
END;
$$;

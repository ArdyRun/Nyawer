-- ============================================================
-- NYAWER — Schema V5 Patch (Media Clip Alert)
-- Jalankan skrip ini secara utuh di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tambah kolom media ke profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cost_per_second INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS media_max_duration INTEGER NOT NULL DEFAULT 30;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alert_duration INTEGER NOT NULL DEFAULT 8;

COMMENT ON COLUMN public.profiles.cost_per_second IS 'Biaya per detik untuk lampirkan video clip. 0 = fitur nonaktif.';
COMMENT ON COLUMN public.profiles.media_max_duration IS 'Durasi maksimal video clip dalam detik.';
COMMENT ON COLUMN public.profiles.alert_duration IS 'Durasi alert popup overlay dalam detik.';


-- 2. Tambah kolom media ke donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS media_duration INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.donations.media_url IS 'Link YouTube/TikTok yang dilampirkan donatur.';
COMMENT ON COLUMN public.donations.media_duration IS 'Durasi video clip yang dipilih donatur (detik).';


-- 3. Update update_profile_secure — tambah 3 parameter media
CREATE OR REPLACE FUNCTION public.update_profile_secure(
    p_session_token UUID,
    p_display_name TEXT,
    p_username TEXT,
    p_bio TEXT,
    p_min_donation INTEGER,
    p_avatar_url TEXT DEFAULT NULL,
    p_cost_per_second INTEGER DEFAULT NULL,
    p_media_max_duration INTEGER DEFAULT NULL,
    p_alert_duration INTEGER DEFAULT NULL
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
        display_name = COALESCE(NULLIF(TRIM(p_display_name), ''), display_name),
        username = COALESCE(p_username, username),
        bio = p_bio,
        min_donation = COALESCE(p_min_donation, min_donation),
        avatar_url = p_avatar_url,
        cost_per_second = COALESCE(p_cost_per_second, cost_per_second),
        media_max_duration = COALESCE(p_media_max_duration, media_max_duration),
        alert_duration = COALESCE(p_alert_duration, alert_duration)
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Profil berhasil diperbarui.');
END;
$$;

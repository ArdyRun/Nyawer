-- ============================================================
-- NYAWER — Schema V4 Patch (Profile Management RPCs)
-- Jalankan skrip ini secara utuh di SQL Editor Supabase Anda
-- ============================================================

-- 1. CHECK USERNAME AVAILABLE (publik, tanpa auth)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean TEXT;
BEGIN
    v_clean := LOWER(REGEXP_REPLACE(TRIM(p_username), '[^a-z0-9_]', '', 'g'));

    IF LENGTH(v_clean) < 3 THEN
        RETURN json_build_object('success', true, 'available', false, 'message', 'Username minimal 3 karakter.');
    END IF;

    RETURN json_build_object(
        'success', true,
        'available', NOT EXISTS(SELECT 1 FROM public.profiles WHERE LOWER(username) = v_clean),
        'username', v_clean
    );
END;
$$;


-- 2. UPDATE PROFILE SECURE — versi baru dengan avatar_url
CREATE OR REPLACE FUNCTION public.update_profile_secure(
    p_session_token UUID,
    p_display_name TEXT,
    p_username TEXT,
    p_bio TEXT,
    p_min_donation INTEGER,
    p_avatar_url TEXT DEFAULT NULL
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
        avatar_url = p_avatar_url
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Profil berhasil diperbarui.');
END;
$$;


-- 3. CHANGE PASSWORD
CREATE OR REPLACE FUNCTION public.change_password(
    p_session_token UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_db_hash TEXT;
BEGIN
    SELECT s.user_id, u.password_hash
    FROM public.user_sessions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.token = p_session_token AND s.expires_at > NOW()
    INTO v_user_id, v_db_hash;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    IF v_db_hash != crypt(p_current_password, v_db_hash) THEN
        RETURN json_build_object('success', false, 'message', 'Password saat ini salah.');
    END IF;

    IF LENGTH(p_new_password) < 6 THEN
        RETURN json_build_object('success', false, 'message', 'Password baru minimal 6 karakter.');
    END IF;

    UPDATE public.users
    SET password_hash = crypt(p_new_password, gen_salt('bf', 8))
    WHERE id = v_user_id;

    -- Invalidate all existing sessions except current
    DELETE FROM public.user_sessions
    WHERE user_id = v_user_id AND token != p_session_token;

    RETURN json_build_object('success', true, 'message', 'Password berhasil diubah.');
END;
$$;


-- 4. DELETE ACCOUNT
CREATE OR REPLACE FUNCTION public.delete_account(p_session_token UUID)
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

    -- Delete user (cascades to profiles, donations, sessions via FK)
    DELETE FROM public.users WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Akun berhasil dihapus.');
END;
$$;


-- ============================================================
-- 5. DONATION GOAL (Target Donasi)
-- ============================================================

-- 5a. Tambah kolom donation_target dan donation_goal_current ke profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS donation_target INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS donation_goal_current INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.donation_target IS 'Target nominal donasi untuk overlay goal. 0 = tidak ada target.';
COMMENT ON COLUMN public.profiles.donation_goal_current IS 'Progress current donasi goal. Bisa di-reset atau ditambah manual.';


-- 5b. SET DONATION TARGET RPC
CREATE OR REPLACE FUNCTION public.set_donation_target(
    p_session_token UUID,
    p_target INTEGER
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

    IF p_target < 0 THEN
        RETURN json_build_object('success', false, 'message', 'Target tidak boleh negatif.');
    END IF;

    UPDATE public.profiles SET donation_target = p_target WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Target donasi berhasil diperbarui.');
END;
$$;


-- 5c. RESET DONATION GOAL (current → 0, target tetap)
CREATE OR REPLACE FUNCTION public.reset_donation_goal(
    p_session_token UUID
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

    UPDATE public.profiles SET donation_goal_current = 0 WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Progress donasi direset ke 0.');
END;
$$;


-- 5d. ADD TO GOAL (manual tambah current)
CREATE OR REPLACE FUNCTION public.add_to_goal(
    p_session_token UUID,
    p_amount INTEGER
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

    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Nominal harus lebih dari 0.');
    END IF;

    UPDATE public.profiles SET donation_goal_current = donation_goal_current + p_amount WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Goal berhasil ditambah.');
END;
$$;

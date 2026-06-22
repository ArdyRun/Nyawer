-- ============================================================
-- NYAWER — Schema V6 Patch (Withdrawal / Tarik Dana)
-- Jalankan skrip ini secara utuh di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tabel withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 50000),
    bank_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    bank_holder TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'rejected')),
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.withdrawals IS 'Daftar penarikan dana oleh streamer.';
COMMENT ON COLUMN public.withdrawals.status IS 'pending: menunggu diproses, processing: sedang diproses, completed: berhasil, rejected: ditolak.';

-- Index
CREATE INDEX IF NOT EXISTS idx_withdrawals_streamer ON public.withdrawals(streamer_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_withdrawal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_withdrawal_timestamp();

-- RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Streamer bisa lihat withdrawal sendiri
CREATE POLICY "Streamers can view own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (streamer_id = auth.uid());

-- Streamer bisa insert withdrawal sendiri
CREATE POLICY "Streamers can insert own withdrawals"
    ON public.withdrawals FOR INSERT
    WITH CHECK (streamer_id = auth.uid());


-- 2. RPC: Request Withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_session_token UUID,
    p_amount INTEGER,
    p_bank_name TEXT,
    p_bank_account TEXT,
    p_bank_holder TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_balance INTEGER;
    v_pending INTEGER;
BEGIN
    -- Validate session
    SELECT user_id FROM public.user_sessions WHERE token = p_session_token AND expires_at > NOW() INTO v_user_id;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    -- Validate amount
    IF p_amount < 50000 THEN
        RETURN json_build_object('success', false, 'message', 'Minimal penarikan Rp 50.000.');
    END IF;

    -- Validate bank fields
    IF TRIM(p_bank_name) = '' OR TRIM(p_bank_account) = '' OR TRIM(p_bank_holder) = '' THEN
        RETURN json_build_object('success', false, 'message', 'Data bank harus diisi lengkap.');
    END IF;

    -- Calculate available balance
    SELECT COALESCE(SUM(amount_received), 0) INTO v_balance
    FROM public.donations
    WHERE streamer_id = v_user_id AND status = 'success' AND (is_test IS NULL OR is_test = false);

    SELECT COALESCE(SUM(amount), 0) INTO v_pending
    FROM public.withdrawals
    WHERE streamer_id = v_user_id AND status = 'completed';

    v_balance := v_balance - v_pending;

    IF p_amount > v_balance THEN
        RETURN json_build_object('success', false, 'message', 'Saldo tidak mencukupi. Saldo tersedia: ' || v_balance || '.');
    END IF;

    -- Insert withdrawal (instant, langsung completed)
    INSERT INTO public.withdrawals (streamer_id, amount, bank_name, bank_account, bank_holder, status)
    VALUES (v_user_id, p_amount, TRIM(p_bank_name), TRIM(p_bank_account), TRIM(p_bank_holder), 'completed');

    RETURN json_build_object('success', true, 'message', 'Penarikan berhasil diajukan.');
END;
$$;


-- 3. RPC: Get My Withdrawals
CREATE OR REPLACE FUNCTION public.get_my_withdrawals(p_session_token UUID)
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

    RETURN json_build_object(
        'success', true,
        'withdrawals', (
            SELECT json_agg(w.*
                ORDER BY w.created_at DESC)
            FROM public.withdrawals w
            WHERE w.streamer_id = v_user_id
        )
    );
END;
$$;


-- 4. RPC: Get Withdrawal Balance
CREATE OR REPLACE FUNCTION public.get_withdrawal_balance(p_session_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_total_received INTEGER;
    v_withdrawn INTEGER;
BEGIN
    SELECT user_id FROM public.user_sessions WHERE token = p_session_token AND expires_at > NOW() INTO v_user_id;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid.');
    END IF;

    -- Total received from successful donations
    SELECT COALESCE(SUM(amount_received), 0) INTO v_total_received
    FROM public.donations
    WHERE streamer_id = v_user_id AND status = 'success' AND (is_test IS NULL OR is_test = false);

    -- Total withdrawals (all completed, instant)
    SELECT COALESCE(SUM(amount), 0) INTO v_withdrawn
    FROM public.withdrawals
    WHERE streamer_id = v_user_id AND status = 'completed';

    RETURN json_build_object(
        'success', true,
        'total_received', v_total_received,
        'withdrawn', v_withdrawn,
        'available_balance', v_total_received - v_withdrawn
    );
END;
$$;

-- FIX: Add SELECT policy on donations table
-- Without this, Supabase Realtime (anon role) cannot see donation rows,
-- so postgres_changes events are silently filtered out.
--
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → Paste → Run

DROP POLICY IF EXISTS "donations: public can read all" ON public.donations;

CREATE POLICY "donations: public can read all"
  ON public.donations FOR SELECT TO anon, authenticated
  USING (true);

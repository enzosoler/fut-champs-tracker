-- ============================================================
--  FUT CHAMPS TRACKER — Supabase Database Setup
--  Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Create the matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result      TEXT NOT NULL CHECK (result IN ('W', 'L')),
  goals_for   INT NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
  goals_against INT NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies — users can only access their own matches

-- Read own matches
CREATE POLICY "Users can read own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own matches
CREATE POLICY "Users can insert own matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own matches
CREATE POLICY "Users can update own matches"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete own matches
CREATE POLICY "Users can delete own matches"
  ON public.matches FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Optional: index for faster queries by user
CREATE INDEX IF NOT EXISTS matches_user_id_idx ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS matches_created_at_idx ON public.matches(created_at DESC);

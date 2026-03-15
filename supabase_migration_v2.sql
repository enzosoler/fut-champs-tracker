-- ============================================================
--  FUT CHAMPS TRACKER v2 — Migration SQL
--  Run this in: Supabase Dashboard > SQL Editor > New Query
--  Safe to run multiple times
-- ============================================================

-- 1. Add new columns to matches table
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_end_type TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS auto_difficulty FLOAT,
  ADD COLUMN IF NOT EXISTS elo_before INT DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS elo_after  INT DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS elo_change INT DEFAULT 0;

-- Add check constraint (drop first if it already exists)
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_match_end_type_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_match_end_type_check
    CHECK (match_end_type IN ('normal', 'extra_time', 'penalties', 'abandoned'));

-- 2. Add saves to match_players
ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS saves INT NOT NULL DEFAULT 0;

-- 3. Create pack_rewards table
CREATE TABLE IF NOT EXISTS public.pack_rewards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_id        TEXT,
  pack_type      TEXT NOT NULL,
  coins_value    INT NOT NULL DEFAULT 0,
  notable_pulls  TEXT,
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS on pack_rewards
ALTER TABLE public.pack_rewards ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe to rerun)
DROP POLICY IF EXISTS "Users can read own packs"   ON public.pack_rewards;
DROP POLICY IF EXISTS "Users can insert own packs"  ON public.pack_rewards;
DROP POLICY IF EXISTS "Users can update own packs"  ON public.pack_rewards;
DROP POLICY IF EXISTS "Users can delete own packs"  ON public.pack_rewards;

CREATE POLICY "Users can read own packs"
  ON public.pack_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packs"
  ON public.pack_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packs"
  ON public.pack_rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own packs"
  ON public.pack_rewards FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS pack_rewards_user_id_idx ON public.pack_rewards(user_id);
CREATE INDEX IF NOT EXISTS pack_rewards_week_id_idx  ON public.pack_rewards(week_id);

-- 6. Opponent record view
CREATE OR REPLACE VIEW public.opponent_records AS
SELECT
  user_id,
  gamertag,
  COUNT(*)                                                        AS total_matches,
  COUNT(*) FILTER (WHERE goals_me > goals_opp
    OR (pk_me IS NOT NULL AND pk_me > pk_opp))                   AS wins,
  COUNT(*) FILTER (WHERE goals_me < goals_opp
    OR (pk_me IS NOT NULL AND pk_me < pk_opp))                   AS losses,
  COUNT(*) FILTER (WHERE goals_me = goals_opp AND pk_me IS NULL) AS draws,
  ROUND(AVG(goals_me)::NUMERIC, 2)                               AS avg_goals_scored,
  ROUND(AVG(goals_opp)::NUMERIC, 2)                              AS avg_goals_conceded,
  MAX(created_at)                                                 AS last_played
FROM public.matches
WHERE gamertag IS NOT NULL AND gamertag != ''
GROUP BY user_id, gamertag
ORDER BY total_matches DESC;

-- 7. WL sessions archive view
CREATE OR REPLACE VIEW public.wl_sessions AS
SELECT
  user_id,
  week_id,
  COUNT(*)                                                        AS total_matches,
  COUNT(*) FILTER (WHERE goals_me > goals_opp
    OR (pk_me IS NOT NULL AND pk_me > pk_opp))                   AS wins,
  COUNT(*) FILTER (WHERE goals_me < goals_opp
    OR (pk_me IS NOT NULL AND pk_me < pk_opp))                   AS losses,
  COUNT(*) FILTER (WHERE goals_me = goals_opp AND pk_me IS NULL) AS draws,
  SUM(goals_me)                                                   AS total_goals_scored,
  SUM(goals_opp)                                                  AS total_goals_conceded,
  ROUND(AVG(auto_difficulty)::NUMERIC, 2)                        AS avg_difficulty,
  MIN(created_at)                                                 AS started_at,
  MAX(created_at)                                                 AS ended_at
FROM public.matches
GROUP BY user_id, week_id
ORDER BY week_id DESC;

-- 8. Player leaderboard view (with saves)
CREATE OR REPLACE VIEW public.player_leaderboard AS
SELECT
  mp.user_id,
  mp.player_id,
  s.name   AS player_name,
  s.position,
  SUM(mp.goals)                                  AS total_goals,
  SUM(mp.assists)                                AS total_assists,
  COUNT(*) FILTER (WHERE mp.motm)                AS total_motm,
  COUNT(*) FILTER (WHERE mp.clean_sheet)         AS total_clean_sheets,
  COALESCE(SUM(mp.saves), 0)                     AS total_saves,
  COUNT(*)                                        AS appearances
FROM public.match_players mp
JOIN public.squad s ON s.id = mp.player_id
GROUP BY mp.user_id, mp.player_id, s.name, s.position;

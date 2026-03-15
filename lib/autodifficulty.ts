/**
 * Auto-Difficulty Calculator — FUT Champs Tracker
 *
 * Computes a bias-free difficulty score (1.0–10.0) based on objective
 * match statistics. Removes the player's self-reported perception and
 * instead derives difficulty from what the numbers show.
 *
 * Weights:
 *  - Opponent xG        (biggest signal — how dangerous were they really?)
 *  - Your possession    (low possession = under pressure)
 *  - Match end type     (ET/Penalties = closer match = harder)
 *  - Ping/connection    (lag makes everything harder)
 *  - Goal difference    (won/lost big = easier/harder)
 *  - Rage quit          (opponent quit = you dominated = easier)
 */

export interface DifficultyInput {
  xg_opp:        number | null;
  xg_me:         number | null;
  possession_me: number | null;  // 0-100 (your possession %)
  goals_me:      number;
  goals_opp:     number;
  pk_me:         number | null;
  pk_opp:        number | null;
  ping:          'Bom' | 'Médio' | 'Lag';
  match_end_type: 'normal' | 'extra_time' | 'penalties' | 'abandoned';
  rage_quit:     'No' | 'Opp' | 'Me';
}

export function calcAutoDifficulty(input: DifficultyInput): number {
  let score = 5.0;

  // --- 1. Opponent xG (weight: up to ±2.5) ---
  // Higher opponent xG = they created more danger = harder
  const xgOpp = input.xg_opp ?? 1.0; // fallback to average if not provided
  if      (xgOpp < 0.3)  score -= 2.0;
  else if (xgOpp < 0.6)  score -= 1.0;
  else if (xgOpp < 0.9)  score -= 0.5;
  else if (xgOpp < 1.2)  score += 0.0;
  else if (xgOpp < 1.6)  score += 0.5;
  else if (xgOpp < 2.0)  score += 1.0;
  else if (xgOpp < 2.5)  score += 1.5;
  else                   score += 2.5;

  // --- 2. Your possession (weight: up to ±1.5) ---
  // Low possession = you were chasing the game = harder
  if (input.possession_me !== null) {
    const pos = input.possession_me;
    if      (pos >= 65) score -= 1.5;
    else if (pos >= 58) score -= 0.8;
    else if (pos >= 52) score -= 0.3;
    else if (pos >= 45) score += 0.0;
    else if (pos >= 38) score += 0.5;
    else if (pos >= 30) score += 1.0;
    else               score += 1.5;
  }

  // --- 3. Match end type (weight: up to +1.5) ---
  // Extra time / penalties = match went to the wire = much harder
  if      (input.match_end_type === 'penalties')  score += 1.5;
  else if (input.match_end_type === 'extra_time') score += 0.8;
  else if (input.match_end_type === 'abandoned')  score += 0.0; // no signal

  // --- 4. Ping / connection (weight: up to +1.0) ---
  if      (input.ping === 'Lag')   score += 1.0;
  else if (input.ping === 'Médio') score += 0.4;

  // --- 5. Rage quit (weight: -0.8 for opp quit) ---
  // If opponent quit, you were winning comfortably → easier
  if (input.rage_quit === 'Opp') score -= 0.8;

  // --- 6. Goal difference (weight: up to ±1.0) ---
  // Determine actual result including PKs
  let goalDiff: number;
  if (input.pk_me !== null && input.pk_opp !== null) {
    goalDiff = input.pk_me - input.pk_opp; // use PK margin
  } else {
    goalDiff = input.goals_me - input.goals_opp;
  }

  if      (goalDiff >=  4) score -= 1.0;
  else if (goalDiff >=  3) score -= 0.7;
  else if (goalDiff >=  2) score -= 0.3;
  else if (goalDiff === 1) score += 0.2;
  else if (goalDiff === 0) score += 0.5;
  else if (goalDiff === -1) score += 0.5;
  else if (goalDiff === -2) score += 0.8;
  else                      score += 1.0;

  // --- 7. xG ratio: opponent scored above their xG = harder (clutch/lucky opp) ---
  if (input.xg_opp !== null && input.goals_opp > input.xg_opp + 0.8) {
    score += 0.5;
  }

  // Clamp to [1, 10] and round to 1 decimal
  return Math.round(Math.max(1.0, Math.min(10.0, score)) * 10) / 10;
}

/** Difficulty label and color for a given score */
export function getDifficultyLabel(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score <= 2.5) return { label: 'Fácil',    color: 'text-green-400',  bg: 'bg-green-500/20'  };
  if (score <= 4.5) return { label: 'Médio',    color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  if (score <= 6.5) return { label: 'Difícil',  color: 'text-orange-400', bg: 'bg-orange-500/20' };
  if (score <= 8.5) return { label: 'Pesado',   color: 'text-red-400',    bg: 'bg-red-500/20'    };
  return              { label: 'Impossível', color: 'text-purple-400', bg: 'bg-purple-500/20' };
}

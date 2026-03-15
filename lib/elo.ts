/**
 * ELO Calculator — FUT Champs Tracker
 *
 * A custom ELO system adjusted by match difficulty.
 * Harder wins earn more ELO; harder losses lose less.
 *
 * Starting ELO: 1000
 */

import { MatchResult } from '@/types';

const BASE_WIN  =  25;
const BASE_DRAW =   0;
const BASE_LOSS = -20;

/**
 * Calculate ELO change for a match.
 * @param result   W / D / L
 * @param autoDiff auto_difficulty score (1–10). Falls back to 5.0 if null.
 */
export function calcEloChange(
  result: MatchResult,
  autoDiff: number | null
): number {
  const diff = autoDiff ?? 5.0;
  const modifier = diff / 5.0; // 1.0 at difficulty 5, 2.0 at difficulty 10, 0.2 at difficulty 1

  let change: number;

  switch (result) {
    case 'W':
      // Win at difficulty 10 → +50 ELO; at difficulty 1 → +5 ELO
      change = Math.round(BASE_WIN * modifier);
      break;
    case 'D':
      // Draw at high difficulty → small positive; at low difficulty → small negative
      change = Math.round((diff - 5) * 1.5);
      break;
    case 'L':
      // Loss at difficulty 10 → only -8 ELO (expected); at difficulty 1 → -40 ELO (shameful)
      // Invert: easier opponent = bigger penalty
      const inverseModifier = (10 - diff + 1) / 5;
      change = Math.round(BASE_LOSS * inverseModifier);
      break;
  }

  return change;
}

/**
 * Compute the full ELO history from an ordered array of matches
 * (oldest first). Returns an array of { date, elo } points.
 */
export function computeEloHistory(
  matches: Array<{
    created_at: string;
    elo_after: number | null;
    elo_change: number | null;
  }>
): Array<{ date: string; elo: number }> {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let elo = 1000;
  return sorted.map(m => {
    if (m.elo_after !== null) {
      elo = m.elo_after;
    } else if (m.elo_change !== null) {
      elo += m.elo_change;
    }
    return { date: m.created_at.slice(0, 10), elo };
  });
}

/** Get a rank tier name based on ELO */
export function getEloTier(elo: number): {
  tier: string;
  color: string;
} {
  if (elo >= 1600) return { tier: 'Lendário',   color: 'text-purple-400' };
  if (elo >= 1400) return { tier: 'Elite',       color: 'text-yellow-400' };
  if (elo >= 1200) return { tier: 'Ouro',        color: 'text-amber-400'  };
  if (elo >= 1050) return { tier: 'Prata',       color: 'text-gray-300'   };
  if (elo >= 900)  return { tier: 'Bronze',      color: 'text-orange-700' };
  return                  { tier: 'Iniciante',   color: 'text-gray-500'   };
}

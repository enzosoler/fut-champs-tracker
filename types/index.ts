// types/index.ts

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';
export type MatchEndType = 'normal' | 'extra_time' | 'penalties' | 'abandoned';

export interface SquadPlayer {
  id: string;
  user_id: string;
  name: string;
  position: Position | string;
  overall: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  week_id: string;
  match_num: number;
  ha: 'Home' | 'Away';
  goals_me: number;
  goals_opp: number;
  pk_me: number | null;
  pk_opp: number | null;
  xg_me: number | null;
  xg_opp: number | null;
  formation_me: string;
  formation_opp: string;
  possession_me: number | null;
  shots_me: number | null;
  ping: 'Bom' | 'Médio' | 'Lag';
  /** @deprecated kept for legacy data only - use auto_difficulty */
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Sweaty';
  auto_difficulty: number | null;
  match_end_type: MatchEndType;
  rage_quit: 'No' | 'Opp' | 'Me';
  platform: 'PlayStation' | 'Xbox' | 'PC';
  gamertag: string;
  notes: string | null;
  elo_before: number | null;
  elo_after: number | null;
  elo_change: number | null;
  created_at: string;
}

export interface MatchPlayer {
  id: string;
  user_id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  motm: boolean;
  clean_sheet: boolean;
  saves: number;
  created_at: string;
  // joined fields
  player?: SquadPlayer;
  squad?: SquadPlayer;
}

export interface MatchWithPlayers extends Match {
  match_players: (MatchPlayer & { squad: SquadPlayer })[];
}

export interface PlayerLeaderboard {
  user_id: string;
  player_id: string;
  player_name: string;
  position: string;
  total_goals: number;
  total_assists: number;
  total_motm: number;
  total_clean_sheets: number;
  total_saves: number;
  appearances: number;
}

export interface OpponentRecord {
  user_id: string;
  gamertag: string;
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  last_played: string;
}

export interface WLSession {
  user_id: string;
  week_id: string;
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  total_goals_scored: number;
  total_goals_conceded: number;
  avg_difficulty: number | null;
  started_at: string;
  ended_at: string;
}

export interface PackReward {
  id: string;
  user_id: string;
  week_id: string | null;
  pack_type: string;
  coins_value: number;
  notable_pulls: string | null;
  opened_at: string;
  created_at: string;
}

export type MatchResult = 'W' | 'D' | 'L';

export function getMatchResult(match: Match): MatchResult {
  if (match.pk_me !== null && match.pk_opp !== null) {
    if (match.pk_me > match.pk_opp) return 'W';
    if (match.pk_me < match.pk_opp) return 'L';
    return 'D';
  }
  if (match.goals_me > match.goals_opp) return 'W';
  if (match.goals_me < match.goals_opp) return 'L';
  return 'D';
}

export const FORMATIONS = [
  '4-3-3', '4-2-3-1', '4-4-2', '4-1-2-1-2', '3-5-2',
  '5-3-2', '4-5-1', '4-2-2-2', '3-4-3', '4-3-2-1',
  '4-4-2 (flat)', '4-3-3 (attack)', '3-4-2-1',
];

export const POSITIONS: Position[] = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM',
  'LM', 'RM', 'LW', 'RW', 'ST', 'CF',
];

export const RANK_THRESHOLDS = [
  { rank: 'Elite III',  wins: 7  },
  { rank: 'Elite II',   wins: 9  },
  { rank: 'Elite I',    wins: 11 },
  { rank: 'Top 200',    wins: 13 },
  { rank: 'Top 100',    wins: 15 },
];

export const PACK_TYPES = [
  'Gold Pack (básico)',
  'Gold Pack (premium)',
  'Rare Gold Pack',
  'Mega Pack',
  'Prime Gold Players Pack',
  'Jumbo Rare Gold Pack',
  'Ultimate Pack',
  'Prime Mixed Stars Pack',
  'Rare Electrum Players Pack',
  'FUT Champions Reward Pack',
  'Elite Pack',
  'Outro',
];

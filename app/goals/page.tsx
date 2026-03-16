'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Match } from '@/types';
import { getMatchResult } from '@/types';
import { getRankFromWins, projectFinalRank, consistencyStats, formationStats } from '@/lib/insights';
import {
  Target, Trophy, TrendingUp, TrendingDown, CheckCircle,
  Circle, Plus, X, Pencil, Save, Loader2, Zap, Shield,
  Star, BarChart2, Flame,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type GoalCategory = 'rank' | 'winrate' | 'streak' | 'defense' | 'custom';

interface Goal {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  target: number;
  unit: string;
  icon: string;
}

const PRESET_GOALS: Goal[] = [
  {
    id: 'reach_elite3',
    category: 'rank',
    title: 'Reach Elite III',
    description: 'Finish a Weekend League with 7+ wins',
    target: 7,
    unit: 'wins',
    icon: '🏆',
  },
  {
    id: 'reach_elite1',
    category: 'rank',
    title: 'Reach Elite I',
    description: 'Finish a Weekend League with 11+ wins',
    target: 11,
    unit: 'wins',
    icon: '⚡',
  },
  {
    id: 'wr60',
    category: 'winrate',
    title: 'Hit 60% Win Rate',
    description: 'Maintain a 60%+ win rate over your next 20 matches',
    target: 60,
    unit: '%',
    icon: '📈',
  },
  {
    id: 'wr70',
    category: 'winrate',
    title: 'Hit 70% Win Rate',
    description: 'Maintain a 70%+ win rate over your next 20 matches',
    target: 70,
    unit: '%',
    icon: '🔥',
  },
  {
    id: 'streak5',
    category: 'streak',
    title: '5-Game Win Streak',
    description: 'Win 5 consecutive matches in a Weekend League',
    target: 5,
    unit: 'wins',
    icon: '⚡',
  },
  {
    id: 'top200',
    category: 'rank',
    title: 'Top 200',
    description: 'Finish a Weekend League with 13+ wins',
    target: 13,
    unit: 'wins',
    icon: '👑',
  },
  {
    id: 'keep_under2',
    category: 'defense',
    title: 'Concede Under 2 Per Game',
    description: 'Average fewer than 2 goals conceded per match',
    target: 2,
    unit: 'goals',
    icon: '🛡️',
  },
  {
    id: 'track50',
    category: 'custom',
    title: 'Track 50 Matches',
    description: 'Log 50 total matches in the app',
    target: 50,
    unit: 'matches',
    icon: '📊',
  },
];

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; color: string; Icon: React.ElementType }> = {
  rank:     { label: 'Rank',       color: 'text-amber-400',   Icon: Trophy    },
  winrate:  { label: 'Win Rate',   color: 'text-emerald-400', Icon: TrendingUp },
  streak:   { label: 'Streak',     color: 'text-orange-400',  Icon: Flame     },
  defense:  { label: 'Defense',    color: 'text-blue-400',    Icon: Shield    },
  custom:   { label: 'Custom',     color: 'text-primary',     Icon: Star      },
};

// ─── Compute goal progress from real data ────────────────────────────────────
function computeProgress(goal: Goal, matches: Match[], currentWLWins: number): { current: number; pct: number; status: 'achieved' | 'in_progress' | 'at_risk' } {
  let current = 0;

  switch (goal.id) {
    case 'reach_elite3':
    case 'reach_elite1':
    case 'top200': {
      current = currentWLWins;
      break;
    }
    case 'wr60':
    case 'wr70': {
      const last20 = matches.slice(-20);
      if (last20.length === 0) { current = 0; break; }
      current = parseFloat(((last20.filter(m => getMatchResult(m) === 'W').length / last20.length) * 100).toFixed(1));
      break;
    }
    case 'streak5': {
      // current best streak in last WL
      const cons = consistencyStats(matches);
      current = cons.maxWinStreak;
      break;
    }
    case 'keep_under2': {
      if (matches.length === 0) { current = 0; break; }
      const avgConc = matches.reduce((s, m) => s + m.goals_opp, 0) / matches.length;
      current = parseFloat(avgConc.toFixed(2));
      // For "under 2" — progress is inverted (lower is better), treat 0 = 100%, 2 = 0%
      const pct = Math.max(0, Math.min(100, ((2 - current) / 2) * 100));
      const status = current < 2 ? 'achieved' : current < 2.5 ? 'in_progress' : 'at_risk';
      return { current, pct, status };
    }
    case 'track50': {
      current = matches.length;
      break;
    }
    default:
      current = 0;
  }

  const pct = Math.min(100, (current / goal.target) * 100);
  const status = pct >= 100 ? 'achieved' : pct >= 60 ? 'in_progress' : 'at_risk';
  return { current, pct, status };
}

function GoalCard({
  goal,
  matches,
  currentWLWins,
  onDismiss,
}: {
  goal: Goal;
  matches: Match[];
  currentWLWins: number;
  onDismiss?: (id: string) => void;
}) {
  const { current, pct, status } = computeProgress(goal, matches, currentWLWins);
  const catCfg = CATEGORY_CONFIG[goal.category];
  const statusColor = status === 'achieved' ? 'text-emerald-400' : status === 'in_progress' ? 'text-amber-400' : 'text-red-400';
  const barColor   = status === 'achieved' ? 'bg-emerald-400' : status === 'in_progress' ? 'bg-amber-400' : 'bg-red-400';
  const isInverted = goal.id === 'keep_under2'; // lower is better

  return (
    <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-2xl leading-none">{goal.icon}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <catCfg.Icon size={10} className={catCfg.color} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${catCfg.color}`}>{catCfg.label}</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">{goal.title}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{goal.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'achieved' && <CheckCircle size={16} className="text-emerald-400" />}
          {onDismiss && (
            <button onClick={() => onDismiss(goal.id)} className="text-[#64748B] hover:text-white transition">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748B]">
            {isInverted
              ? `Avg: ${current} ${goal.unit} (target: &lt; ${goal.target})`
              : `${current} / ${goal.target} ${goal.unit}`
            }
          </span>
          <span className={`font-bold ${statusColor}`}>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {status === 'achieved' && (
        <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
          <CheckCircle size={12} /> Goal achieved! 🎉
        </div>
      )}
    </div>
  );
}

// ─── Rank projection card ─────────────────────────────────────────────────────
function RankProjectionCard({ matches, currentWLWins, currentWLTotal }: { matches: Match[]; currentWLWins: number; currentWLTotal: number }) {
  const projected = projectFinalRank(currentWLWins, currentWLTotal, 20);
  const rank = getRankFromWins(projected);
  const currentRank = getRankFromWins(currentWLWins);

  return (
    <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target size={15} className="text-primary" />
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Rank Projection</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-[#64748B]">Current</p>
          <p className="text-lg font-black text-white">{currentRank}</p>
          <p className="text-xs text-[#64748B] mt-1">{currentWLWins}W – {currentWLTotal - currentWLWins}L played</p>
        </div>
        <div className="text-3xl text-[#64748B]">→</div>
        <div className="text-right">
          <p className="text-xs text-[#64748B]">Projected Final</p>
          <p className="text-2xl font-black text-primary">{rank}</p>
          <p className="text-xs text-[#64748B] mt-1">~{projected} wins projected</p>
        </div>
      </div>
      {currentWLTotal < 20 && (
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentWLTotal / 20) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_goals') ?? '[]'); } catch { return []; }
  });

  // Pull current WL stats from localStorage
  const [currentWLWins, setCurrentWLWins] = useState(0);
  const [currentWLTotal, setCurrentWLTotal] = useState(0);

  useEffect(() => {
    supabase.from('matches').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMatches(data as Match[]); setLoading(false); });

    // Try to read active WL data
    try {
      const activeWLId = localStorage.getItem('fut_active_wl');
      if (activeWLId) {
        supabase
          .from('matches')
          .select('goals_me,goals_opp,pk_me,pk_opp')
          .eq('week_id', activeWLId)
          .then(({ data }) => {
            if (data) {
              const wins = data.filter(m => getMatchResult(m as any) === 'W').length;
              setCurrentWLWins(wins);
              setCurrentWLTotal(data.length);
            }
          });
      }
    } catch {}
  }, []);

  function dismissGoal(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem('dismissed_goals', JSON.stringify(next)); } catch {}
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const cons = consistencyStats(matches);
  const fStats = formationStats(matches);
  const activeGoals = PRESET_GOALS.filter(g => !dismissed.includes(g.id));

  const achieved = activeGoals.filter(g => {
    const { status } = computeProgress(g, matches, currentWLWins);
    return status === 'achieved';
  });
  const inProgress = activeGoals.filter(g => {
    const { status } = computeProgress(g, matches, currentWLWins);
    return status !== 'achieved';
  });

  return (
    <div className="px-4 pt-2 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black font-heading text-white flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Goals
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Track your competitive milestones</p>
        </div>
        {achieved.length > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
            <CheckCircle size={11} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{achieved.length} achieved</span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {matches.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-[#273246] rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-400">{cons.overallWR.toFixed(0)}%</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Win Rate</p>
          </div>
          <div className="bg-card border border-[#273246] rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">{cons.maxWinStreak}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Best Streak</p>
          </div>
          <div className="bg-card border border-[#273246] rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-primary">{matches.length}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Matches</p>
          </div>
        </div>
      )}

      {/* Rank Projection (show only if there's an active WL) */}
      {currentWLTotal > 0 && (
        <RankProjectionCard matches={matches} currentWLWins={currentWLWins} currentWLTotal={currentWLTotal} />
      )}

      {/* Best Formation Recommendation */}
      {fStats.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl">⚔️</div>
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Best Formation</p>
            <p className="text-lg font-black text-white">{fStats[0].formation}</p>
            <p className="text-xs text-[#64748B]">{fStats[0].winRate.toFixed(0)}% win rate across {fStats[0].total} matches</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-[#64748B]">avg goals</p>
            <p className="text-base font-bold text-emerald-400">{fStats[0].avgGoalsFor.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* In-progress goals */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
            Active Goals ({inProgress.length})
          </p>
          {inProgress.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              matches={matches}
              currentWLWins={currentWLWins}
              onDismiss={dismissGoal}
            />
          ))}
        </div>
      )}

      {/* Achieved goals */}
      {achieved.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle size={11} /> Achieved ({achieved.length})
          </p>
          {achieved.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              matches={matches}
              currentWLWins={currentWLWins}
            />
          ))}
        </div>
      )}

      {/* Improvement tips section */}
      <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">How to Progress</p>
        <div className="space-y-2.5">
          {[
            { icon: '🎯', text: 'Stick to your best formation in ranked games' },
            { icon: '🧠', text: 'Take a break after 3 consecutive losses' },
            { icon: '📊', text: 'Review your Insights after each WL session' },
            { icon: '⚡', text: 'Your first 5 matches set the mental tone — start strong' },
            { icon: '🛡️', text: 'Prioritize defensive shape over attack when ahead' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">{tip.icon}</span>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

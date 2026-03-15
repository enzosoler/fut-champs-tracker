'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Flame, Share2, Plus, Loader2, Target, Zap } from 'lucide-react';
import {
  Match, MatchWithPlayers, MatchPlayer, SquadPlayer, PlayerLeaderboard,
  getMatchResult, RANK_THRESHOLDS, MatchResult, WLSession
} from '@/types';
import { getEloTier } from '@/lib/elo';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [matches,     setMatches]     = useState<MatchWithPlayers[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerLeaderboard[]>([]);
  const [wlSessions,  setWlSessions]  = useState<WLSession[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [matchRes, lbRes, wlRes] = await Promise.all([
        supabase.from('matches').select('*, match_players(*, squad(*))').order('created_at', { ascending: false }),
        supabase.from('player_leaderboard').select('*').order('total_goals', { ascending: false }),
        supabase.from('wl_sessions').select('*').order('week_id', { ascending: false }).limit(5),
      ]);
      if (matchRes.data)  setMatches(matchRes.data as MatchWithPlayers[]);
      if (lbRes.data)     setLeaderboard(lbRes.data as PlayerLeaderboard[]);
      if (wlRes.data)     setWlSessions(wlRes.data as WLSession[]);
      setLoading(false);
    }
    load();
  }, []);

  const totalMatches   = matches.length;
  const wins           = matches.filter(m => getMatchResult(m) === 'W').length;
  const draws          = matches.filter(m => getMatchResult(m) === 'D').length;
  const losses         = matches.filter(m => getMatchResult(m) === 'L').length;
  const winRate        = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const totalGoalsFor  = matches.reduce((s, m) => s + m.goals_me,  0);
  const totalGoalsAg   = matches.reduce((s, m) => s + m.goals_opp, 0);

  let currentStreak = 0;
  for (const m of matches) {
    if (getMatchResult(m) === 'W') currentStreak++;
    else break;
  }

  const last5: MatchResult[] = matches.slice(0, 5).map(m => getMatchResult(m));

  const currentElo = matches.find(m => m.elo_after != null)?.elo_after ?? 1000;
  const { tierKey: eloTierKey, color: eloColor } = getEloTier(currentElo);

  const currentWeekId  = matches.length > 0 ? matches[0].week_id : null;
  const weekMatches    = currentWeekId ? matches.filter(m => m.week_id === currentWeekId) : [];
  const weekWins       = weekMatches.filter(m => getMatchResult(m) === 'W').length;
  const weekPlayed     = weekMatches.length;
  const weekRemaining  = 15 - weekPlayed;
  const nextRank       = RANK_THRESHOLDS.find(r => r.wins > weekWins);
  const winsNeeded     = nextRank ? Math.max(0, nextRank.wins - weekWins) : 0;

  const diffMatches = matches.slice(0, 10).filter(m => m.auto_difficulty != null);
  const avgDiff = diffMatches.length > 0
    ? (diffMatches.reduce((s, m) => s + (m.auto_difficulty ?? 0), 0) / diffMatches.length).toFixed(1)
    : null;

  function handleShare() {
    if (!currentWeekId) return;
    const topScorer = leaderboard[0];
    const lines = [
      `⚽ FUT Champions — ${currentWeekId}`,
      `📊 ${weekPlayed}/15 ${t('matches', lang)} | ${weekWins}W`,
      nextRank ? `🎯 ${winsNeeded}W → ${nextRank.rank}` : '✅',
      avgDiff ? `⚡ ${t('avg_diff', lang)}: ${avgDiff}` : '',
      topScorer ? `🥇 ${topScorer.player_name} (${topScorer.total_goals}⚽)` : '',
    ].filter(Boolean).join('\n');
    if (navigator.share) navigator.share({ text: lines });
    else {
      navigator.clipboard.writeText(lines);
      alert('Copied!');
    }
  }

  const resultColor: Record<MatchResult, string> = {
    W: 'bg-[#FFB800] text-black',
    D: 'bg-yellow-400 text-black',
    L: 'bg-red-500 text-white',
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Loader2 className="animate-spin text-white" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Dashboard</h1>
            {currentWeekId && (
              <p className="text-sm text-gray-400">{t('week', lang)}: <span className="text-white font-semibold">{currentWeekId}</span></p>
            )}
          </div>
          <button onClick={() => router.push('/add-match')}
            className="flex items-center gap-2 bg-[#FFB800] text-black font-bold px-4 py-2.5 rounded-xl hover:bg-[#CC9400] transition text-sm">
            <Plus size={16} /> {t('nav_register', lang)}
          </button>
        </div>

        {totalMatches === 0 ? (
          <div className="text-center py-20 text-gray-500 space-y-4">
            <Trophy size={48} className="mx-auto opacity-20" />
            <p className="text-lg">{t('no_data', lang)}</p>
            <button onClick={() => router.push('/add-match')}
              className="bg-[#FFB800] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#CC9400] transition">
              {t('register_first', lang)}
            </button>
          </div>
        ) : (
          <>
            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-green-400">{wins}</p>
                <p className="text-xs text-gray-400 mt-1">{t('wins', lang)}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-red-400">{losses}</p>
                <p className="text-xs text-gray-400 mt-1">{t('losses', lang)}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-white">{winRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{t('win_rate', lang)}</p>
              </div>
            </div>

            {/* Goals + Streak + ELO row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-white">{totalGoalsFor}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t('goals_scored', lang)}</p>
                <p className="text-xl font-black text-red-400 mt-1">{totalGoalsAg}</p>
                <p className="text-[10px] text-gray-500">{t('goals_conceded', lang)}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                {currentStreak > 0 ? (
                  <>
                    <p className="text-3xl font-black text-[#FFB800]">🔥{currentStreak}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('win_streak', lang)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black text-gray-500">—</p>
                    <p className="text-xs text-gray-400 mt-1">{t('no_streak', lang)}</p>
                  </>
                )}
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${eloColor}`}>{currentElo}</p>
                <p className={`text-xs mt-1 ${eloColor}`}>{t(eloTierKey as Parameters<typeof t>[0], lang)}</p>
                {avgDiff && (
                  <p className="text-[10px] text-gray-500 mt-1">{t('avg_diff', lang)} {avgDiff}</p>
                )}
              </div>
            </div>

            {/* Last 5 form */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="text-orange-400" size={16} />
                <span className="text-sm font-semibold text-gray-300">{t('last_5', lang)}</span>
              </div>
              <div className="flex gap-2">
                {last5.map((r, i) => (
                  <div key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${resultColor[r]}`}>
                    {r}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - last5.length) }).map((_, i) => (
                  <div key={`e-${i}`}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-700 text-xs">
                    —
                  </div>
                ))}
              </div>
            </div>

            {/* Rank calculator */}
            <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="text-white" size={16} />
                <span className="text-sm font-semibold text-gray-300">{t('rank_calc', lang)}</span>
                <span className="ml-auto text-xs text-gray-500">{weekPlayed}/15 {t('matches', lang)}</span>
              </div>
              <div className="w-full bg-[#262626] rounded-full h-3">
                <div className="bg-[#FFB800] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (weekWins / 15) * 100)}%` }} />
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {RANK_THRESHOLDS.map(r => (
                  <div key={r.rank}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                      weekWins >= r.wins ? 'border-white bg-white/10 text-white' : 'border-white/5 text-gray-600'
                    }`}>
                    <p>{r.wins}W</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{r.rank.replace('Elite', 'Eli').replace('Top ', 'T')}</p>
                  </div>
                ))}
              </div>
              {nextRank ? (
                <p className="text-sm text-center">
                  <span className="text-white font-bold">{winsNeeded}</span>
                  <span className="text-gray-400"> W / </span>
                  <span className="text-white font-bold">{weekRemaining}</span>
                  <span className="text-gray-400"> {t('matches', lang)} → </span>
                  <span className="text-white font-bold">{nextRank.rank}</span>
                </p>
              ) : (
                <p className="text-sm text-center text-white font-bold">🏆</p>
              )}
            </div>

            {/* WL Archive */}
            {wlSessions.length > 1 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('wl_archive', lang)}</h2>
                <div className="space-y-2">
                  {wlSessions.map((s) => {
                    const isCurrentWeek = s.week_id === currentWeekId;
                    const pct = s.total_matches > 0 ? Math.round((s.wins / s.total_matches) * 100) : 0;
                    const wL = t('wins', lang).charAt(0);
                    const dL = t('draws', lang).charAt(0);
                    const lL = t('losses', lang).charAt(0);
                    return (
                      <div key={s.week_id}
                        className={`bg-[#1a1a1a] border rounded-xl px-4 py-3 flex items-center gap-3 ${
                          isCurrentWeek ? 'border-[#FFB800]/40' : 'border-white/10'
                        }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isCurrentWeek ? 'text-[#FFB800]' : 'text-white'}`}>
                              {s.week_id}
                            </span>
                            {isCurrentWeek && (
                              <span className="text-[10px] text-[#FFB800] border border-[#FFB800]/30 rounded px-1">
                                {t('current_label', lang)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{s.total_matches}/15</span>
                            <span className="text-green-400">{s.wins}{wL}</span>
                            <span className="text-yellow-400">{s.draws}{dL}</span>
                            <span className="text-red-400">{s.losses}{lL}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${pct >= 60 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {pct}%
                          </p>
                          {s.avg_difficulty && (
                            <p className="text-[10px] text-gray-500">{Number(s.avg_difficulty).toFixed(1)}⚡</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Player leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-white" size={16} />
                  <span className="text-sm font-semibold text-gray-300">{t('squad_highlights', lang)}</span>
                </div>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((p, i) => (
                    <div key={p.player_id} className="flex items-center gap-3 py-1.5">
                      <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium">{p.player_name}</span>
                      <span className="text-xs text-gray-500">{p.position}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-white font-bold">{p.total_goals}⚽</span>
                        <span className="text-blue-400 font-bold">{p.total_assists}🎯</span>
                        {p.total_saves > 0 && (
                          <span className="text-cyan-400 font-bold">{p.total_saves}🧤</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent matches */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('recent_matches', lang)}</h2>
              {matches.slice(0, 5).map(match => {
                const result = getMatchResult(match);
                return (
                  <div key={match.id}
                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${resultColor[result]}`}>
                      {result}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">
                        {match.goals_me} – {match.goals_opp}
                        {match.pk_me !== null && (
                          <span className="text-gray-500 font-normal text-xs ml-1">
                            (pen {match.pk_me}–{match.pk_opp})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {match.gamertag || '—'} · {match.ha}
                        {match.auto_difficulty !== null && (
                          <span className={` · ${
                            (match.auto_difficulty ?? 5) <= 4 ? 'text-green-400' :
                            (match.auto_difficulty ?? 5) <= 6 ? 'text-yellow-400' :
                            (match.auto_difficulty ?? 5) <= 8 ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {' '}⚡{match.auto_difficulty?.toFixed(1)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-600">{match.week_id} #{match.match_num}</span>
                      {(match.elo_change ?? 0) !== 0 && (
                        <p className={`text-xs font-bold ${(match.elo_change ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(match.elo_change ?? 0) > 0 ? '+' : ''}{match.elo_change}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <button onClick={() => router.push('/history')}
                className="w-full py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:border-white/20 hover:text-white transition">
                {t('history_title', lang)} →
              </button>
            </div>

            {/* Share */}
            <button onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 border border-white/30 rounded-xl py-3 text-white text-sm font-semibold hover:bg-white/5 transition">
              <Share2 size={16} /> {t('share_week', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

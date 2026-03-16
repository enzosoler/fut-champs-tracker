'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Loader2, Play, Flag, TrendingUp, Clock, Target } from 'lucide-react';
import { Match, WLSession, getMatchResult, MatchResult, RANK_THRESHOLDS } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t, ACTIVE_WL_KEY } from '@/lib/i18n';
import { projectFinalRank, getRankFromWins } from '@/lib/insights';

const MAX_MATCHES = 15;

export default function WeekendLeaguePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading,       setLoading]       = useState(true);
  const [activeWlId,    setActiveWlId]    = useState<string | null>(null);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [history,       setHistory]       = useState<WLSession[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_WL_KEY);
      if (stored) setActiveWlId(stored);
    } catch {}
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeWlId) loadActiveMatches(activeWlId);
  }, [activeWlId]);

  async function loadHistory() {
    setLoading(true);
    const { data } = await supabase
      .from('wl_sessions')
      .select('*')
      .order('started_at', { ascending: false });
    if (data) setHistory(data as WLSession[]);
    setLoading(false);
  }

  async function loadActiveMatches(wlId: string) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('week_id', wlId)
      .order('created_at', { ascending: true });
    if (data) setActiveMatches(data as Match[]);
  }

  async function startNewWL() {
    const { data: allMatches } = await supabase.from('matches').select('week_id');
    const wlNums = [
      ...(allMatches || []).map((m: { week_id: string }) => m.week_id),
      ...history.map(s => s.week_id),
    ]
      .filter((id: string) => /^wl\d+$/.test(id))
      .map((id: string) => parseInt(id.replace('wl', ''), 10));

    const nextNum  = wlNums.length > 0 ? Math.max(...wlNums) + 1 : 1;
    const newWlId  = `wl${nextNum}`;

    setActiveWlId(newWlId);
    setActiveMatches([]);
    try { localStorage.setItem(ACTIVE_WL_KEY, newWlId); } catch {}
  }

  function endWL() {
    if (!confirm(t('wl_end_confirm', lang))) return;
    setActiveWlId(null);
    setActiveMatches([]);
    try { localStorage.removeItem(ACTIVE_WL_KEY); } catch {}
    loadHistory();
  }

  function wlLabel(weekId: string): string {
    const m = weekId.match(/^wl(\d+)$/);
    return m ? `Weekend League #${m[1]}` : weekId;
  }

  const activeWins   = activeMatches.filter(m => getMatchResult(m) === 'W').length;
  const activeDraws  = activeMatches.filter(m => getMatchResult(m) === 'D').length;
  const activeLosses = activeMatches.filter(m => getMatchResult(m) === 'L').length;
  const activeGF     = activeMatches.reduce((s, m) => s + m.goals_me,  0);
  const activeGA     = activeMatches.reduce((s, m) => s + m.goals_opp, 0);
  const activePlayed = activeMatches.length;
  const winRate      = activePlayed > 0 ? Math.round((activeWins / activePlayed) * 100) : 0;
  const goalDiff     = activeGF - activeGA;

  // Current + next rank
  const currentRank  = RANK_THRESHOLDS.slice().reverse().find(r => activeWins >= r.wins);
  const nextRank     = RANK_THRESHOLDS.find(r => r.wins > activeWins);
  const winsNeeded   = nextRank ? Math.max(0, nextRank.wins - activeWins) : 0;
  const rankPrevWins = currentRank ? currentRank.wins : 0;
  const rankNextWins = nextRank ? nextRank.wins : MAX_MATCHES;
  const rankProgress = rankNextWins > rankPrevWins
    ? ((activeWins - rankPrevWins) / (rankNextWins - rankPrevWins)) * 100
    : 100;

  // Streak
  let streak = 0;
  for (let i = activeMatches.length - 1; i >= 0; i--) {
    if (getMatchResult(activeMatches[i]) === 'W') streak++;
    else break;
  }

  const resultStyle: Record<MatchResult, string> = {
    W: 'bg-win/10 border-2 border-win text-win',
    D: 'bg-draw/10 border-2 border-draw text-draw',
    L: 'bg-loss/10 border-2 border-loss text-loss',
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9]">
      {/* Page Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Trophy className="text-primary" size={22} />
          {t('wl_title', lang)}
        </h1>
        {activeWlId && activePlayed < MAX_MATCHES && (
          <button
            onClick={() => router.push('/add-match')}
            className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition shadow-lg shadow-primary/20"
          >
            <Plus size={14} /> LOG MATCH
          </button>
        )}
      </div>

      <div className="px-4 space-y-8 pb-6">

        {/* Active WL */}
        {activeWlId ? (
          <>
            {/* Progress Card */}
            <div className="bg-card rounded-2xl border border-[#273246] overflow-hidden">
              {/* gradient top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
              <div className="p-5 space-y-5">
                {/* Record + goal diff */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">
                      Current Progress
                    </p>
                    <h2 className="text-3xl font-heading font-extrabold">
                      <span className="text-win">{activeWins}</span>
                      <span className="text-[#94A3B8] mx-2">–</span>
                      <span className="text-loss">{activeLosses}</span>
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-1">{MAX_MATCHES - activePlayed} Games Remaining</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-heading font-bold ${goalDiff >= 0 ? 'text-win' : 'text-loss'}`}>
                      {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                    </p>
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Goal Diff</p>
                  </div>
                </div>

                {/* Rank progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                    <span className="text-[#94A3B8]">{currentRank?.rank ?? 'No Rank'} ({rankPrevWins}W)</span>
                    <span className="text-primary">{nextRank ? `${nextRank.rank} (${nextRank.wins}W)` : 'Max Rank!'}</span>
                  </div>
                  <div className="relative h-3 w-full bg-[#273246] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, rankProgress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[#94A3B8]">
                      Projected: <span className="text-white font-bold">{currentRank?.rank ?? '—'}</span>
                    </p>
                    {nextRank && (
                      <p className="text-xs text-[#94A3B8]">
                        Need: <span className="text-white font-bold">{winsNeeded} more W</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-xl bg-background/50 border border-[#273246]/50">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Win Rate</p>
                    <p className="text-lg font-heading font-bold">{winRate}%</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-background/50 border border-[#273246]/50">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Streak</p>
                    <p className={`text-lg font-heading font-bold ${streak > 0 ? 'text-win' : 'text-[#94A3B8]'}`}>
                      {streak > 0 ? `${streak}W` : '—'}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-background/50 border border-[#273246]/50">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">GF-GA</p>
                    <p className="text-lg font-heading font-bold">{activeGF}<span className="text-[#94A3B8] text-sm">-{activeGA}</span></p>
                  </div>
                </div>

                {/* End WL button */}
                <button
                  onClick={endWL}
                  className="w-full py-2.5 rounded-xl border border-loss/30 text-loss text-sm font-semibold flex items-center justify-center gap-2 hover:bg-loss/10 transition"
                >
                  <Flag size={14} /> {t('wl_end', lang)}
                </button>
              </div>
            </div>

            {/* Match History */}
            {activePlayed > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                  Match History
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {activeMatches.map((match, i) => {
                    const r = getMatchResult(match);
                    return (
                      <div
                        key={match.id}
                        className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center relative overflow-hidden ${resultStyle[r]}`}
                      >
                        <span className="text-xs font-bold">{r}</span>
                        <span className="text-[8px] font-bold opacity-60 absolute bottom-1.5">
                          {match.goals_me}-{match.goals_opp}
                        </span>
                      </div>
                    );
                  })}
                  {Array.from({ length: MAX_MATCHES - activePlayed }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex-shrink-0 w-12 h-16 rounded-xl border border-dashed border-[#273246] flex items-center justify-center text-[#94A3B8] text-xs font-bold"
                    >
                      {activePlayed + i + 1}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Block Performance */}
            {activePlayed >= 5 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Performance by Block</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1–5',   matches: activeMatches.slice(0, 5)  },
                    { label: '6–10',  matches: activeMatches.slice(5, 10)  },
                    { label: '11–15', matches: activeMatches.slice(10, 15) },
                  ].map(block => {
                    const played = block.matches.length;
                    if (played === 0) return (
                      <div key={block.label} className="bg-card border border-[#273246] rounded-xl p-3 text-center opacity-40">
                        <p className="text-[10px] text-[#64748B] uppercase font-bold">{block.label}</p>
                        <p className="text-sm text-[#64748B] mt-1">—</p>
                      </div>
                    );
                    const bWins = block.matches.filter(m => getMatchResult(m) === 'W').length;
                    const wr = Math.round((bWins / played) * 100);
                    return (
                      <div key={block.label} className="bg-card border border-[#273246] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wide">{block.label}</p>
                        <p className={`text-xl font-black mt-1 ${wr >= 60 ? 'text-emerald-400' : wr >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {wr}%
                        </p>
                        <p className="text-[10px] text-[#64748B]">{bWins}W / {played}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Rank Projection */}
            {activePlayed >= 3 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-primary" />
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Projected Finish</h3>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#64748B]">At current pace</p>
                    <p className="text-2xl font-black text-white">{getRankFromWins(projectFinalRank(activeWins, activePlayed, MAX_MATCHES))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#64748B]">Projected wins</p>
                    <p className="text-2xl font-black text-primary">~{projectFinalRank(activeWins, activePlayed, MAX_MATCHES)}</p>
                  </div>
                </div>
              </section>
            )}

            {activePlayed >= MAX_MATCHES && (
              <div className="bg-win/10 border border-win/30 rounded-2xl p-4 text-center">
                <p className="text-win font-semibold text-sm">✅ WL complete! End when ready.</p>
              </div>
            )}
          </>
        ) : (
          /* No active WL */
          <div className="bg-card border border-[#273246] rounded-2xl p-10 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Trophy className="text-primary/40" size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-white font-semibold">{t('wl_no_active', lang)}</p>
              <p className="text-xs text-[#94A3B8]">Start to track up to 15 matches</p>
            </div>
            <button
              onClick={startNewWL}
              className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
            >
              <Play size={16} /> {t('wl_start', lang)}
            </button>
          </div>
        )}

        {/* WL History */}
        {history.filter(s => s.week_id !== activeWlId).length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              {t('wl_history', lang)}
            </h3>
            <div className="space-y-2">
              {history
                .filter(s => s.week_id !== activeWlId)
                .map(session => {
                  const isWlFormat = /^wl\d+$/.test(session.week_id);
                  const label = isWlFormat ? wlLabel(session.week_id) : session.week_id;
                  const wr = session.total_matches > 0 ? Math.round((session.wins / session.total_matches) * 100) : 0;
                  const sessionRank = RANK_THRESHOLDS.slice().reverse().find(r => session.wins >= r.wins);
                  return (
                    <div key={session.week_id} className="bg-card border border-[#273246] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                            <Trophy size={15} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{label}</p>
                            <p className="text-xs text-[#94A3B8]">
                              {session.total_matches} matches
                              {sessionRank && <span className="text-primary ml-2">· {sessionRank.rank}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-sm font-bold">
                            <span className="text-win">{session.wins}W</span>{' '}
                            <span className="text-draw">{session.draws}D</span>{' '}
                            <span className="text-loss">{session.losses}L</span>
                          </p>
                          <p className={`text-sm font-bold ${wr >= 60 ? 'text-win' : wr >= 40 ? 'text-draw' : 'text-loss'}`}>
                            {wr}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

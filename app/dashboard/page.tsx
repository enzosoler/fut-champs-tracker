'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Flame, Share2, Plus, Loader2, Target, Users, BarChart2, BookOpen, Zap, Star, ChevronRight } from 'lucide-react';
import {
  Match, MatchWithPlayers, PlayerLeaderboard,
  getMatchResult, RANK_THRESHOLDS, MatchResult, WLSession
} from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t, ACTIVE_WL_KEY } from '@/lib/i18n';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [matches,     setMatches]     = useState<MatchWithPlayers[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerLeaderboard[]>([]);
  const [wlSessions,  setWlSessions]  = useState<WLSession[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeWlId,  setActiveWlId]  = useState<string | null>(null);
  const [user,        setUser]        = useState<SupabaseUser | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [matchRes, lbRes, wlRes, userRes] = await Promise.all([
        supabase.from('matches').select('*, match_players(*, squad(*))').order('created_at', { ascending: false }),
        supabase.from('player_leaderboard').select('*').order('total_goals', { ascending: false }),
        supabase.from('wl_sessions').select('*').order('week_id', { ascending: false }).limit(5),
        supabase.auth.getUser(),
      ]);
      if (matchRes.data)  setMatches(matchRes.data as MatchWithPlayers[]);
      if (lbRes.data)     setLeaderboard(lbRes.data as PlayerLeaderboard[]);
      if (wlRes.data)     setWlSessions(wlRes.data as WLSession[]);
      if (userRes.data.user) setUser(userRes.data.user);

      try {
        const wl = localStorage.getItem(ACTIVE_WL_KEY);
        if (wl) setActiveWlId(wl);
      } catch {}

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

  // Active WL stats
  const wlMatches  = activeWlId ? matches.filter(m => m.week_id === activeWlId) : [];
  const wlWins     = wlMatches.filter(m => getMatchResult(m) === 'W').length;
  const wlLosses   = wlMatches.filter(m => getMatchResult(m) === 'L').length;
  const wlPlayed   = wlMatches.length;
  const wlLeft     = 15 - wlPlayed;
  const wlWinRate  = wlPlayed > 0 ? Math.round((wlWins / wlPlayed) * 100) : 0;

  const currentWeekId = activeWlId ?? (matches.length > 0 ? matches[0].week_id : null);
  const weekMatches   = currentWeekId ? matches.filter(m => m.week_id === currentWeekId) : [];
  const weekWins      = weekMatches.filter(m => getMatchResult(m) === 'W').length;
  const weekPlayed    = weekMatches.length;
  const nextRank      = RANK_THRESHOLDS.find(r => r.wins > weekWins);
  const winsNeeded    = nextRank ? Math.max(0, nextRank.wins - weekWins) : 0;
  const weekRemaining = 15 - weekPlayed;

  // Best WL finish
  const bestFinish = wlSessions.reduce((best, s) => {
    const rank = RANK_THRESHOLDS.slice().reverse().find(r => s.wins >= r.wins);
    if (!rank) return best;
    const rankIdx = RANK_THRESHOLDS.findIndex(r => r.rank === rank.rank);
    const bestIdx = best ? RANK_THRESHOLDS.findIndex(r => r.rank === best) : -1;
    return rankIdx > bestIdx ? rank.rank : best;
  }, null as string | null);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Player';
  const avatarUrl   = user?.user_metadata?.avatar_url ?? null;

  const resultColor: Record<MatchResult, string> = {
    W: 'bg-win/20 border-2 border-win text-win',
    D: 'bg-draw/20 border-2 border-draw text-draw',
    L: 'bg-loss/20 border-2 border-loss text-loss',
  };

  function handleShare() {
    if (!currentWeekId) return;
    const topScorer = leaderboard[0];
    const lines = [
      `⚽ FUT Champions — ${currentWeekId}`,
      `📊 ${weekPlayed}/15 matches | ${weekWins}W`,
      nextRank ? `🎯 ${winsNeeded}W → ${nextRank.rank}` : '✅ Max rank!',
      topScorer ? `🥇 ${topScorer.player_name} (${topScorer.total_goals}⚽)` : '',
    ].filter(Boolean).join('\n');
    if (navigator.share) navigator.share({ text: lines });
    else {
      navigator.clipboard.writeText(lines);
      alert('Copied!');
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9]">
      {/* Page Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-1">
              FC 26 Competitive Tracker
            </p>
            <h1 className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Welcome back, {displayName}
            </h1>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center ring-2 ring-background overflow-hidden hover:border-primary/60 transition"
            title="Edit profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-8 pb-6">

        {totalMatches === 0 ? (
          <div className="space-y-6 pb-4">
            {/* Hero empty state */}
            <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-card" style={{ boxShadow: '0 0 40px -15px rgba(99,102,241,0.4)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
              <div className="relative p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <Trophy size={30} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">Welcome to FC Tracker</h2>
                  <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">Track every FUT Champions match, analyze your performance, and climb the ranks.</p>
                </div>
                <button
                  onClick={() => router.push('/add-match')}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-primary/30 flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} /> Log Your First Match
                </button>
                <p className="text-xs text-[#94A3B8]/60">Takes less than 30 seconds</p>
              </div>
            </div>

            {/* Feature cards */}
            <section className="space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#94A3B8] uppercase tracking-wider">What you can track</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BarChart2, color: 'text-primary', bg: 'bg-primary/10', title: 'Win Rate & Streaks', desc: 'Track W/D/L trends over time' },
                  { icon: Users, color: 'text-accent', bg: 'bg-accent/10', title: 'Squad Stats', desc: 'Goals, assists & saves per player' },
                  { icon: Trophy, color: 'text-draw', bg: 'bg-draw/10', title: 'WL Rankings', desc: 'Monitor your rank progression' },
                  { icon: Zap, color: 'text-win', bg: 'bg-win/10', title: 'xG Analytics', desc: 'Shot quality & efficiency data' },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} className="bg-card border border-[#273246] rounded-2xl p-4 space-y-2">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon size={15} className={color} />
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                    <p className="text-xs text-[#94A3B8] leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick start steps */}
            <section className="space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#94A3B8] uppercase tracking-wider">Quick Start</h2>
              <div className="bg-card border border-[#273246] rounded-2xl divide-y divide-[#273246]">
                {[
                  { step: 1, title: 'Add your squad', desc: 'Set up your FUT players', href: '/squad', done: false },
                  { step: 2, title: 'Start a Weekend League', desc: 'Begin tracking your WL session', href: '/weekend-league', done: false },
                  { step: 3, title: 'Log your first match', desc: 'Record score, players & xG', href: '/add-match', done: false },
                  { step: 4, title: 'Check your analytics', desc: 'Discover your performance trends', href: '/analytics', done: false },
                ].map(({ step, title, desc, href }) => (
                  <button key={step} onClick={() => router.push(href)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[#1a2333] transition text-left">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{step}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-[#94A3B8]">{desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#94A3B8] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </section>

            {/* WL rank reference */}
            <section className="space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#94A3B8] uppercase tracking-wider">FUT Champions Ranks</h2>
              <div className="bg-card border border-[#273246] rounded-2xl p-4">
                <div className="grid grid-cols-5 gap-1.5">
                  {RANK_THRESHOLDS.map(r => (
                    <div key={r.rank} className="p-1.5 rounded-lg border border-[#273246] text-center">
                      <p className="text-xs font-bold text-[#94A3B8]">{r.wins}W</p>
                      <p className="text-[9px] text-[#475569] mt-0.5">{r.rank.replace('Elite', 'E').replace('Top ', 'T')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <>
            {/* Active Weekend League */}
            {activeWlId ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-heading font-semibold">Active Weekend League</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    In Progress
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-primary/30" style={{ boxShadow: '0 0 30px -10px rgba(99,102,241,0.3)' }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#141A25]/80 to-[#141A25]" />
                  <div className="relative p-5">
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <p className="text-xs text-[#94A3B8] font-medium mb-1">Current Record</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-heading font-bold text-win">{wlWins}</span>
                          <span className="text-xl font-bold text-[#94A3B8]">–</span>
                          <span className="text-4xl font-heading font-bold text-loss">{wlLosses}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#94A3B8] font-medium mb-1">Games Left</p>
                        <p className="text-3xl font-heading font-bold">{wlLeft}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-background/50 rounded-xl p-3 border border-[#273246]/70">
                        <p className="text-xs text-[#94A3B8] mb-1 flex items-center gap-1">
                          <TrendingUp size={10} className="text-primary" /> Win Rate
                        </p>
                        <p className="text-lg font-heading font-bold">{wlWinRate}%</p>
                      </div>
                      <div className="bg-background/50 rounded-xl p-3 border border-[#273246]/70">
                        <p className="text-xs text-[#94A3B8] mb-1 flex items-center gap-1">
                          <Flame size={10} className="text-draw" /> Streak
                        </p>
                        <p className={`text-lg font-heading font-bold ${currentStreak > 0 ? 'text-win' : 'text-[#94A3B8]'}`}>
                          {currentStreak > 0 ? `${currentStreak} Wins` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push('/add-match')}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-primary/20"
                      >
                        <Plus size={16} /> Log Match
                      </button>
                      <button
                        onClick={() => router.push('/weekend-league')}
                        className="flex-1 bg-muted hover:bg-muted/80 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-[#273246]"
                      >
                        <Trophy size={16} /> View WL
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-3">
                <h2 className="text-base font-heading font-semibold">Weekend League</h2>
                <div
                  onClick={() => router.push('/weekend-league')}
                  className="bg-card border border-[#273246] rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Trophy className="text-primary" size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">No active WL</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Tap to start a new Weekend League</p>
                  </div>
                  <span className="text-[#94A3B8] text-sm">→</span>
                </div>
              </section>
            )}

            {/* Career Overview */}
            <section className="space-y-3">
              <h2 className="text-base font-heading font-semibold">Career Overview</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl p-4 border border-[#273246]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Trophy className="text-primary" size={16} />
                  </div>
                  <p className="text-2xl font-heading font-bold mb-0.5">{bestFinish ?? '—'}</p>
                  <p className="text-xs text-[#94A3B8]">Best WL Finish</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-[#273246]">
                  <div className="w-8 h-8 rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
                    <Target className="text-chart-5" size={16} />
                  </div>
                  <p className="text-2xl font-heading font-bold mb-0.5">{totalMatches}</p>
                  <p className="text-xs text-[#94A3B8]">Total Matches</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-[#273246] col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-win/10 flex items-center justify-center border border-win/20">
                      <TrendingUp className="text-win" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Overall Win Rate</p>
                      <p className="text-xs text-[#94A3B8]">{wins}W · {draws}D · {losses}L</p>
                    </div>
                  </div>
                  <p className={`text-2xl font-heading font-bold ${winRate >= 60 ? 'text-win' : winRate >= 40 ? 'text-white' : 'text-loss'}`}>
                    {winRate}%
                  </p>
                </div>
              </div>
            </section>

            {/* Rank Progress */}
            {weekPlayed > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-heading font-semibold">Rank Progress</h2>
                <div className="bg-card border border-[#273246] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                    <span className="text-[#94A3B8]">{weekWins} wins</span>
                    {nextRank && <span className="text-primary">{nextRank.rank} needs {nextRank.wins}W</span>}
                  </div>
                  <div className="relative h-3 w-full bg-[#273246] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (weekPlayed / 15) * 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RANK_THRESHOLDS.map(r => (
                      <div
                        key={r.rank}
                        className={`p-1.5 rounded-lg border text-center text-[10px] font-semibold transition ${
                          weekWins >= r.wins
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-[#273246] text-[#94A3B8]'
                        }`}
                      >
                        <p>{r.wins}W</p>
                        <p className="opacity-70 mt-0.5">{r.rank.replace('Elite', 'E').replace('Top ', 'T')}</p>
                      </div>
                    ))}
                  </div>
                  {nextRank ? (
                    <p className="text-sm text-center text-[#94A3B8]">
                      <span className="text-white font-bold">{winsNeeded}</span> wins needed ·{' '}
                      <span className="text-white font-bold">{weekRemaining}</span> games left
                    </p>
                  ) : (
                    <p className="text-sm text-center text-win font-bold">🏆 Max rank achieved!</p>
                  )}
                </div>
              </section>
            )}

            {/* Last 5 */}
            <section className="space-y-3">
              <h2 className="text-base font-heading font-semibold">{t('last_5', lang)}</h2>
              <div className="flex gap-2">
                {last5.map((r, i) => (
                  <div key={i} className={`w-12 h-16 rounded-xl flex flex-col items-center justify-center font-bold text-sm ${resultColor[r]}`}>
                    {r}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - last5.length) }).map((_, i) => (
                  <div key={`e-${i}`} className="w-12 h-16 rounded-xl border-2 border-dashed border-[#273246] flex items-center justify-center text-[#94A3B8] text-xs">
                    —
                  </div>
                ))}
              </div>
            </section>

            {/* Player leaderboard */}
            {leaderboard.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-heading font-semibold">{t('squad_highlights', lang)}</h2>
                  <button onClick={() => router.push('/squad')} className="text-xs font-bold text-primary">
                    View All →
                  </button>
                </div>
                <div className="bg-card border border-[#273246] rounded-2xl divide-y divide-[#273246]">
                  {leaderboard.slice(0, 5).map((p, i) => (
                    <div key={p.player_id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-draw' : 'text-[#94A3B8]'}`}>
                        {i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{p.player_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.player_name}</p>
                        <p className="text-xs text-[#94A3B8]">{p.position}</p>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <div className="text-center">
                          <p className="font-bold">{p.total_goals}</p>
                          <p className="text-[8px] text-[#94A3B8] uppercase">Gls</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-chart-5">{p.total_assists}</p>
                          <p className="text-[8px] text-[#94A3B8] uppercase">Ast</p>
                        </div>
                        {p.total_saves > 0 && (
                          <div className="text-center">
                            <p className="font-bold text-accent">{p.total_saves}</p>
                            <p className="text-[8px] text-[#94A3B8] uppercase">Svs</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Goal Stats */}
            <section className="space-y-3">
              <h2 className="text-base font-heading font-semibold">Goal Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-[#273246] rounded-2xl p-4">
                  <p className="text-2xl font-heading font-bold text-win">{totalGoalsFor}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{t('goals_scored', lang)}</p>
                </div>
                <div className="bg-card border border-[#273246] rounded-2xl p-4">
                  <p className="text-2xl font-heading font-bold text-loss">{totalGoalsAg}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{t('goals_conceded', lang)}</p>
                </div>
              </div>
            </section>

            {/* Recent matches */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-heading font-semibold">{t('recent_matches', lang)}</h2>
                <button onClick={() => router.push('/history')} className="text-xs font-bold text-primary">
                  {t('history_title', lang)} →
                </button>
              </div>
              <div className="space-y-2">
                {matches.slice(0, 5).map(match => {
                  const result = getMatchResult(match);
                  return (
                    <div key={match.id} className="bg-card border border-[#273246] rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        result === 'W' ? 'bg-win/15 border border-win/40 text-win' :
                        result === 'L' ? 'bg-loss/15 border border-loss/40 text-loss' :
                        'bg-draw/15 border border-draw/40 text-draw'
                      }`}>
                        {result}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {match.goals_me} – {match.goals_opp}
                          {match.pk_me !== null && (
                            <span className="text-[#94A3B8] font-normal text-xs ml-1">(pen {match.pk_me}–{match.pk_opp})</span>
                          )}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">{match.gamertag || '—'} · {match.ha}</p>
                      </div>
                      <span className="text-xs text-[#94A3B8]">{match.week_id} #{match.match_num}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 border border-[#273246] rounded-xl py-3 text-sm text-[#94A3B8] font-semibold hover:border-primary/40 hover:text-white transition"
            >
              <Share2 size={15} /> {t('share_week', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

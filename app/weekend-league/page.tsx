'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Loader2, Play, Flag } from 'lucide-react';
import { Match, WLSession, getMatchResult, MatchResult, RANK_THRESHOLDS } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t, ACTIVE_WL_KEY } from '@/lib/i18n';

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
    // Determine next WL number from all existing matches + wl_sessions
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

  // Active WL stats
  const activeWins   = activeMatches.filter(m => getMatchResult(m) === 'W').length;
  const activeDraws  = activeMatches.filter(m => getMatchResult(m) === 'D').length;
  const activeLosses = activeMatches.filter(m => getMatchResult(m) === 'L').length;
  const activeGF     = activeMatches.reduce((s, m) => s + m.goals_me,  0);
  const activeGA     = activeMatches.reduce((s, m) => s + m.goals_opp, 0);
  const activePlayed = activeMatches.length;
  const nextRank     = RANK_THRESHOLDS.find(r => r.wins > activeWins);
  const winsNeeded   = nextRank ? Math.max(0, nextRank.wins - activeWins) : 0;
  const form         = activeMatches.reduce((acc, m) => {
    const r = getMatchResult(m);
    return acc + (r === 'W' ? 1 : r === 'L' ? -1 : 0);
  }, 0);

  const resultColor: Record<MatchResult, string> = {
    W: 'bg-[#FFB800] text-black',
    D: 'bg-yellow-400 text-black',
    L: 'bg-red-500 text-white',
  };
  const resultLabel: Record<MatchResult, string> = {
    W: t('win', lang).charAt(0),
    D: t('draw', lang).charAt(0),
    L: t('loss', lang).charAt(0),
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Loader2 className="animate-spin text-white" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-2xl mx-auto p-4 space-y-5">

        <h1 className="text-2xl font-black">{t('wl_title', lang)}</h1>

        {/* ── Active WL ── */}
        {activeWlId ? (
          <div className="bg-[#1a1a1a] border border-[#FFB800]/30 rounded-2xl p-5 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="text-[#FFB800]" size={20} />
                <span className="font-black text-lg">{wlLabel(activeWlId)}</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  {t('wl_active', lang)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${form > 0 ? 'bg-green-500/20 text-green-400' : form < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  Form {form > 0 ? `+${form}` : form}
                </span>
              </div>
              <span className="text-gray-400 font-bold text-sm">{activePlayed}/{MAX_MATCHES}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FFB800] rounded-full transition-all duration-500"
                style={{ width: `${(activePlayed / MAX_MATCHES) * 100}%` }}
              />
            </div>

            {/* 15-slot grid (5×3) */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: MAX_MATCHES }).map((_, i) => {
                const match = activeMatches[i];
                if (!match) return (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border border-white/10 flex items-center justify-center text-gray-600 text-xs font-bold"
                  >
                    {i + 1}
                  </div>
                );
                const r = getMatchResult(match);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center font-black gap-0.5 ${resultColor[r]}`}
                  >
                    <span className="text-sm">{resultLabel[r]}</span>
                    <span className="text-[10px] opacity-80">{match.goals_me}-{match.goals_opp}</span>
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-black text-green-400">{activeWins}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t('wins', lang)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-black text-yellow-400">{activeDraws}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t('draws', lang)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-black text-red-400">{activeLosses}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t('losses', lang)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-black text-white">
                  {activeGF}<span className="text-gray-500 text-sm">-{activeGA}</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">GF-GA</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className={`text-2xl font-black ${form > 0 ? 'text-green-400' : form < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {form > 0 ? `+${form}` : form}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Form</p>
              </div>
            </div>

            {/* Next rank hint */}
            {nextRank && activePlayed < MAX_MATCHES && (
              <p className="text-xs text-center text-gray-400">
                🎯 {winsNeeded} {t('wins', lang).toLowerCase()} para{' '}
                <span className="text-[#FFB800] font-semibold">{nextRank.rank}</span>
              </p>
            )}

            {activePlayed >= MAX_MATCHES && (
              <p className="text-xs text-center text-green-400 font-semibold">
                ✅ WL completa! Encerra quando quiser.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/add-match')}
                disabled={activePlayed >= MAX_MATCHES}
                className="flex-1 bg-[#FFB800] text-black font-bold py-3 rounded-xl hover:bg-[#CC9400] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('nav_register', lang)}
              </button>
              <button
                onClick={endWL}
                className="px-5 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition font-semibold text-sm flex items-center gap-1.5"
              >
                <Flag size={14} /> {t('wl_end', lang)}
              </button>
            </div>
          </div>

        ) : (
          /* ── No active WL ── */
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-10 text-center space-y-5">
            <Trophy size={52} className="mx-auto text-[#FFB800]/25" />
            <div className="space-y-1">
              <p className="text-white font-semibold">{t('wl_no_active', lang)}</p>
              <p className="text-xs text-gray-500">Inicie para registrar até 15 partidas nesta WL</p>
            </div>
            <button
              onClick={startNewWL}
              className="bg-[#FFB800] text-black font-black px-8 py-3.5 rounded-xl hover:bg-[#CC9400] transition flex items-center gap-2 mx-auto text-base"
            >
              <Play size={18} /> {t('wl_start', lang)}
            </button>
          </div>
        )}

        {/* ── WL History ── */}
        {history.filter(s => s.week_id !== activeWlId).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              {t('wl_history', lang)}
            </h2>
            {history
              .filter(s => s.week_id !== activeWlId)
              .map(session => {
                const isWlFormat = /^wl\d+$/.test(session.week_id);
                const label = isWlFormat ? wlLabel(session.week_id) : session.week_id;
                return (
                  <div key={session.week_id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#FFB800]/10 rounded-lg p-2">
                          <Trophy size={15} className="text-[#FFB800]" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{label}</p>
                          <p className="text-xs text-gray-500">{session.total_matches} partidas</p>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-bold">
                          <span className="text-green-400">{session.wins}V</span>{' '}
                          <span className="text-yellow-400">{session.draws}E</span>{' '}
                          <span className="text-red-400">{session.losses}D</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.total_goals_scored}⚽ — {session.total_goals_conceded} sofridos
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>
    </div>
  );
}

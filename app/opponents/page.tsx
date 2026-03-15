'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, getMatchResult, MatchResult } from '@/types';
import { Loader2, Users, ChevronDown, ChevronUp, Trophy, TrendingDown, Minus as MinusIcon } from 'lucide-react';

interface OpponentSummary {
  gamertag: string;
  total: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  lastPlayed: string;
  matches: Match[];
}

export default function OpponentsPage() {
  const [opponents, setOpponents] = useState<OpponentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'total' | 'wins' | 'losses'>('total');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!data) { setLoading(false); return; }

      // Group by gamertag
      const map: Record<string, Match[]> = {};
      for (const m of data as Match[]) {
        if (!m.gamertag || m.gamertag.trim() === '') continue;
        const tag = m.gamertag.trim();
        if (!map[tag]) map[tag] = [];
        map[tag].push(m);
      }

      const summaries: OpponentSummary[] = Object.entries(map).map(([gamertag, matches]) => {
        let wins = 0, losses = 0, draws = 0, goalsFor = 0, goalsAgainst = 0;
        for (const m of matches) {
          const r = getMatchResult(m);
          if (r === 'W') wins++;
          else if (r === 'L') losses++;
          else draws++;
          goalsFor     += m.goals_me;
          goalsAgainst += m.goals_opp;
        }
        return {
          gamertag,
          total: matches.length,
          wins, losses, draws,
          goalsFor, goalsAgainst,
          lastPlayed: matches[0].created_at,
          matches,
        };
      });

      setOpponents(summaries);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...opponents]
    .filter(o => o.gamertag.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'wins')   return b.wins   - a.wins;
      if (sortBy === 'losses') return b.losses - a.losses;
      return b.total - a.total;
    });

  const resultColor: Record<MatchResult, string> = {
    W: 'bg-[#FFB800] text-black',
    D: 'bg-yellow-400 text-black',
    L: 'bg-red-500 text-white',
  };

  function winRateBadge(o: OpponentSummary) {
    const pct = o.total > 0 ? Math.round((o.wins / o.total) * 100) : 0;
    if (pct >= 70) return 'text-green-400';
    if (pct >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-black">Oponentes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seu histórico contra cada gamertag</p>
        </div>

        {opponents.length === 0 ? (
          <div className="text-center py-20 text-gray-500 space-y-3">
            <Users size={48} className="mx-auto opacity-20" />
            <p>Nenhum oponente registrado ainda.</p>
            <p className="text-sm">Registre partidas com gamertag preenchido para ver o histórico aqui.</p>
          </div>
        ) : (
          <>
            {/* Search + Sort */}
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar gamertag..."
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-600"
              />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'total' | 'wins' | 'losses')}
                className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white"
              >
                <option value="total">Mais jogados</option>
                <option value="wins">Mais vitórias</option>
                <option value="losses">Mais derrotas</option>
              </select>
            </div>

            {/* Summary stats row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3">
                <p className="text-2xl font-black">{opponents.length}</p>
                <p className="text-xs text-gray-400">Oponentes</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3">
                <p className="text-2xl font-black text-green-400">
                  {opponents.filter(o => o.wins > o.losses).length}
                </p>
                <p className="text-xs text-gray-400">+ W que L</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3">
                <p className="text-2xl font-black text-red-400">
                  {opponents.filter(o => o.losses > o.wins).length}
                </p>
                <p className="text-xs text-gray-400">+ L que W</p>
              </div>
            </div>

            {/* Opponent list */}
            <div className="space-y-2">
              {sorted.map(opp => {
                const isExpanded = expandedTag === opp.gamertag;
                const pct = opp.total > 0 ? Math.round((opp.wins / opp.total) * 100) : 0;
                const gd  = opp.goalsFor - opp.goalsAgainst;

                return (
                  <div key={opp.gamertag}
                    className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
                    {/* Main row */}
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.02] transition"
                      onClick={() => setExpandedTag(isExpanded ? null : opp.gamertag)}
                    >
                      {/* W/L/D record */}
                      <div className="flex gap-1">
                        <span className="text-xs font-black text-green-400 w-6 text-center">{opp.wins}</span>
                        <span className="text-xs text-gray-600">/</span>
                        <span className="text-xs font-black text-yellow-400 w-6 text-center">{opp.draws}</span>
                        <span className="text-xs text-gray-600">/</span>
                        <span className="text-xs font-black text-red-400 w-6 text-center">{opp.losses}</span>
                      </div>

                      {/* Gamertag */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{opp.gamertag}</p>
                        <p className="text-xs text-gray-500">
                          {opp.total} {opp.total === 1 ? 'partida' : 'partidas'} ·
                          Saldo {gd > 0 ? '+' : ''}{gd} ·{' '}
                          GF {opp.goalsFor} / GA {opp.goalsAgainst}
                        </p>
                      </div>

                      {/* Win rate */}
                      <div className="text-right mr-2">
                        <p className={`text-lg font-black ${winRateBadge(opp)}`}>{pct}%</p>
                        <p className="text-[10px] text-gray-600">win rate</p>
                      </div>

                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>

                    {/* Expanded: all matches against this opponent */}
                    {isExpanded && (
                      <div className="border-t border-white/5 px-4 py-3 space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Histórico de partidas</p>
                        {opp.matches.map(m => {
                          const r = getMatchResult(m);
                          return (
                            <div key={m.id} className="flex items-center gap-3 py-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${resultColor[r]}`}>
                                {r}
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-bold">
                                  {m.goals_me}–{m.goals_opp}
                                  {m.pk_me !== null && (
                                    <span className="text-gray-500 text-xs font-normal ml-1">
                                      ({m.pk_me}–{m.pk_opp} pen)
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">{m.week_id} #{m.match_num}</span>
                              </div>
                              {m.auto_difficulty !== null && (
                                <span className={`text-xs font-bold ${
                                  m.auto_difficulty <= 4 ? 'text-green-400' :
                                  m.auto_difficulty <= 6 ? 'text-yellow-400' :
                                  m.auto_difficulty <= 8 ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                  {m.auto_difficulty.toFixed(1)}⚡
                                </span>
                              )}
                              <span className="text-[10px] text-gray-600">
                                {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          );
                        })}

                        {/* Mini stats vs this opponent */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Média gols marcados</p>
                            <p className="font-bold text-white">
                              {(opp.goalsFor / opp.total).toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Média gols sofridos</p>
                            <p className="font-bold text-red-400">
                              {(opp.goalsAgainst / opp.total).toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

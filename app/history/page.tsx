'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Loader2, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import { Match, MatchPlayer, SquadPlayer, getMatchResult, MatchResult } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

interface MatchWithPlayers extends Match {
  match_players: (MatchPlayer & { squad: SquadPlayer })[];
}

export default function HistoryPage() {
  const { lang } = useLanguage();
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<'All' | MatchResult>('All');
  const [filterWeek, setFilterWeek] = useState('All');

  async function fetchMatches() {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, match_players(*, squad(*))')
      .order('week_id', { ascending: false })
      .order('match_num', { ascending: true });
    if (data) setMatches(data as MatchWithPlayers[]);
    setLoading(false);
  }

  useEffect(() => { fetchMatches(); }, []);

  async function handleDelete(id: string) {
    if (!confirm(t('delete_confirm', lang))) return;
    setDeletingId(id);
    await supabase.from('matches').delete().eq('id', id);
    setMatches(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  }

  const resultColor: Record<MatchResult, string> = {
    W: 'bg-[#FFB800] text-black',
    D: 'bg-yellow-400 text-black',
    L: 'bg-red-500 text-white',
  };
  const resultBorderColor: Record<MatchResult, string> = {
    W: 'border-[#FFB800]/30',
    D: 'border-yellow-400/30',
    L: 'border-red-500/30',
  };
  const difficultyColor: Record<string, string> = {
    Easy: 'bg-green-500/20 text-green-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard: 'bg-orange-500/20 text-orange-400',
    Sweaty: 'bg-red-500/20 text-red-400',
  };
  const pingColor: Record<string, string> = {
    Bom: 'text-green-400',
    Médio: 'text-yellow-400',
    Lag: 'text-red-400',
  };
  const haColor: Record<string, string> = {
    Home: 'bg-blue-500/20 text-blue-400',
    Away: 'bg-purple-500/20 text-purple-400',
  };

  const weekIds = Array.from(new Set(matches.map(m => m.week_id))).sort((a, b) => b.localeCompare(a));
  const filtered = matches.filter(m => {
    if (filterWeek !== 'All' && m.week_id !== filterWeek) return false;
    if (filterResult !== 'All' && getMatchResult(m) !== filterResult) return false;
    return true;
  });
  const grouped: Record<string, MatchWithPlayers[]> = {};
  for (const m of filtered) {
    if (!grouped[m.week_id]) grouped[m.week_id] = [];
    grouped[m.week_id].push(m);
  }

  function exportCSV() {
    const headers = [
      'week_id','match_num','ha','result','goals_me','goals_opp',
      'pk_me','pk_opp','xg_me','xg_opp','formation_me','formation_opp',
      'possession_me','shots_me','ping','auto_difficulty','match_end_type',
      'rage_quit','platform','gamertag','elo_change','elo_after','notes','date'
    ];
    const rows = matches.map(m => [
      m.week_id, m.match_num, m.ha, getMatchResult(m),
      m.goals_me, m.goals_opp,
      m.pk_me ?? '', m.pk_opp ?? '',
      m.xg_me ?? '', m.xg_opp ?? '',
      m.formation_me, m.formation_opp,
      m.possession_me ?? '', m.shots_me ?? '',
      m.ping, m.auto_difficulty ?? '', m.match_end_type ?? '',
      m.rage_quit, m.platform, m.gamertag,
      m.elo_change ?? '', m.elo_after ?? '',
      (m.notes ?? '').replace(/,/g, ';'),
      m.created_at.slice(0, 10),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `fut-champs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const haLabel = (ha: string) => ha === 'Home' ? t('home', lang) : t('away', lang);
  const endLabel = (et: string | null) => {
    if (!et || et === 'normal') return null;
    if (et === 'extra_time') return `⏰ ${t('end_extra_time', lang)}`;
    if (et === 'penalties')  return `🥅 ${t('end_penalties', lang)}`;
    if (et === 'abandoned')  return `🚪 ${t('end_abandoned', lang)}`;
    return null;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Loader2 className="animate-spin text-white" size={36} />
    </div>
  );

  const wL = t('wins', lang).charAt(0);
  const dL = t('draws', lang).charAt(0);
  const lL = t('losses', lang).charAt(0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">{t('history_title', lang)}</h1>
          {matches.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 border border-white/20 rounded-xl px-3 py-2 text-xs text-gray-300 hover:border-white/40 hover:text-white transition">
              <Download size={13} /> {t('export_csv', lang)}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Filter size={12} /> {t('filter', lang)}
          </div>
          {(['All', 'W', 'D', 'L'] as const).map(r => (
            <button key={r} onClick={() => setFilterResult(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                filterResult === r
                  ? r === 'All' ? 'border-white/50 bg-white/10 text-white'
                    : r === 'W' ? 'border-white bg-white/10 text-white'
                    : r === 'D' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-white/10 text-gray-500 hover:border-white/20'
              }`}>
              {r === 'All' ? t('all', lang) : r === 'W' ? t('wins', lang) : r === 'D' ? t('draws', lang) : t('losses', lang)}
            </button>
          ))}
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 focus:outline-none focus:border-white">
            <option value="All">{t('all_weeks', lang)}</option>
            {weekIds.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>{t('no_data', lang)}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([week, weekMatches]) => {
            const wW = weekMatches.filter(m => getMatchResult(m) === 'W').length;
            const wDr = weekMatches.filter(m => getMatchResult(m) === 'D').length;
            const wLo = weekMatches.filter(m => getMatchResult(m) === 'L').length;
            return (
              <div key={week} className="space-y-2">
                <div className="flex items-center gap-3 pb-1">
                  <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{week}</h2>
                  <div className="flex gap-1.5 text-xs">
                    <span className="text-white font-bold">{wW}{wL}</span>
                    <span className="text-yellow-400 font-bold">{wDr}{dL}</span>
                    <span className="text-red-400 font-bold">{wLo}{lL}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-gray-600">{weekMatches.length}/15</span>
                </div>

                {weekMatches.map(match => {
                  const result = getMatchResult(match);
                  const isExpanded = expandedId === match.id;
                  return (
                    <div key={match.id}
                      className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition ${resultBorderColor[result]}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${resultColor[result]}`}>
                          {result}
                        </div>
                        <div className="flex items-baseline gap-1 flex-shrink-0">
                          <span className="text-xl font-black">{match.goals_me}</span>
                          <span className="text-gray-600 font-bold">–</span>
                          <span className="text-xl font-black text-gray-400">{match.goals_opp}</span>
                          {match.pk_me !== null && (
                            <span className="text-xs text-gray-600 ml-1">({match.pk_me}–{match.pk_opp})</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{match.gamertag || '—'}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${haColor[match.ha]}`}>{haLabel(match.ha)}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColor[match.difficulty]}`}>{match.difficulty}</span>
                            <span className={`text-xs font-semibold ${pingColor[match.ping]}`}>{match.ping}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">#{match.match_num}</span>
                        <button onClick={() => setExpandedId(isExpanded ? null : match.id)}
                          className="text-gray-600 hover:text-gray-300 transition flex-shrink-0">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button onClick={() => handleDelete(match.id)} disabled={deletingId === match.id}
                          className="text-gray-700 hover:text-red-400 transition flex-shrink-0">
                          {deletingId === match.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-white/5 px-4 py-4 space-y-4">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {match.xg_me !== null && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">{t('xg_mine', lang)}</span>
                                  <span className="font-semibold text-white">{match.xg_me?.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">{t('xg_opp', lang)}</span>
                                  <span className="font-semibold text-red-400">{match.xg_opp?.toFixed(1)}</span>
                                </div>
                              </>
                            )}
                            {match.formation_me && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">{t('my_formation', lang)}</span>
                                  <span className="font-semibold">{match.formation_me}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">{t('opp_formation', lang)}</span>
                                  <span className="font-semibold">{match.formation_opp}</span>
                                </div>
                              </>
                            )}
                            {match.possession_me !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t('possession', lang)}</span>
                                <span className="font-semibold">{match.possession_me}%</span>
                              </div>
                            )}
                            {match.shots_me !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t('shots', lang)}</span>
                                <span className="font-semibold">{match.shots_me}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('platform', lang)}</span>
                              <span className="font-semibold">{match.platform}</span>
                            </div>
                            {match.auto_difficulty !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">⚡ {t('difficulty', lang)}</span>
                                <span className={`font-bold ${
                                  (match.auto_difficulty ?? 5) <= 4 ? 'text-green-400' :
                                  (match.auto_difficulty ?? 5) <= 6 ? 'text-yellow-400' :
                                  (match.auto_difficulty ?? 5) <= 8 ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                  {match.auto_difficulty?.toFixed(1)} / 10
                                </span>
                              </div>
                            )}
                            {endLabel(match.match_end_type ?? null) && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t('how_ended', lang)}</span>
                                <span className="font-semibold text-blue-400">{endLabel(match.match_end_type ?? null)}</span>
                              </div>
                            )}
                            {(match.elo_change ?? 0) !== 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">ELO</span>
                                <span className={`font-semibold ${(match.elo_change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {(match.elo_change ?? 0) > 0 ? '+' : ''}{match.elo_change} → {match.elo_after}
                                </span>
                              </div>
                            )}
                            {match.rage_quit !== 'No' && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t('rage_quit', lang)}</span>
                                <span className={`font-semibold ${match.rage_quit === 'Opp' ? 'text-green-400' : 'text-red-400'}`}>
                                  {match.rage_quit === 'Opp' ? t('rq_opp', lang) : t('rq_me', lang)}
                                </span>
                              </div>
                            )}
                          </div>

                          {match.match_players.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">{t('player_stats', lang)}</p>
                              <div className="space-y-1">
                                {match.match_players.map(mp => (
                                  <div key={mp.id} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 w-4 text-center text-xs">{mp.squad?.position?.slice(0, 2)}</span>
                                    <span className="flex-1 font-medium">{mp.squad?.name ?? '—'}</span>
                                    {mp.goals > 0 && <span className="text-white font-bold text-xs">{mp.goals}⚽</span>}
                                    {mp.assists > 0 && <span className="text-blue-400 font-bold text-xs">{mp.assists}🎯</span>}
                                    {mp.motm && <span className="text-yellow-400 text-xs">⭐</span>}
                                    {mp.clean_sheet && <span className="text-cyan-400 text-xs">🛡</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {match.notes && (
                            <div className="bg-[#262626] rounded-xl px-3 py-2 text-sm text-gray-300 italic">
                              {match.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

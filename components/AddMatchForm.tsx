'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Plus, Minus, Star, Shield, Loader2, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { SquadPlayer, FORMATIONS, MatchEndType } from '@/types';
import { calcAutoDifficulty, getDifficultyLabel, DifficultyInput } from '@/lib/autodifficulty';
import { calcEloChange, getEloTier } from '@/lib/elo';
import { useLanguage } from '@/components/LanguageProvider';
import { t, ACTIVE_WL_KEY } from '@/lib/i18n';

interface PlayerEntry {
  player: SquadPlayer;
  goals: number;
  assists: number;
  motm: boolean;
  clean_sheet: boolean;
  saves: number;
}

export default function AddMatchForm() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [playerEntries, setPlayerEntries] = useState<PlayerEntry[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentElo, setCurrentElo] = useState<number>(1000);

  const [weekId,    setWeekId]    = useState('');
  const [activeWl,  setActiveWl]  = useState<string | null>(null);
  const [matchNum, setMatchNum] = useState(1);
  const [ha, setHa] = useState<'Home' | 'Away'>('Home');
  const [goalsMe, setGoalsMe] = useState(0);
  const [goalsOpp, setGoalsOpp] = useState(0);
  const [pkMe, setPkMe] = useState('');
  const [pkOpp, setPkOpp] = useState('');
  const [xgMe, setXgMe] = useState('');
  const [xgOpp, setXgOpp] = useState('');
  const [formationMe, setFormationMe] = useState('4-3-3');
  const [formationOpp, setFormationOpp] = useState('4-3-3');
  const [possessionMe, setPossessionMe] = useState('');
  const [shotsMe, setShotsMe] = useState('');
  const [ping, setPing] = useState<'Bom' | 'Médio' | 'Lag'>('Bom');
  const [matchEndType, setMatchEndType] = useState<MatchEndType>('normal');
  const [rageQuit, setRageQuit] = useState<'No' | 'Opp' | 'Me'>('No');
  const [platform, setPlatform] = useState<'PlayStation' | 'Xbox' | 'PC'>('PlayStation');
  const [gamertag, setGamertag] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Load active WL from localStorage
    try {
      const wl = localStorage.getItem(ACTIVE_WL_KEY);
      if (wl) { setActiveWl(wl); setWeekId(wl); }
    } catch {}

    supabase.from('squad').select('*').eq('is_active', true).order('position').order('name')
      .then(({ data }) => { if (data) setSquad(data as SquadPlayer[]); });
    supabase.from('matches').select('elo_after, week_id').order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          if (data[0].elo_after) setCurrentElo(data[0].elo_after);
          // Count matches in current WL to set match number
        }
      });
  }, []);

  const diffInput: DifficultyInput = {
    xg_opp:        xgOpp !== '' ? parseFloat(xgOpp) : null,
    xg_me:         xgMe  !== '' ? parseFloat(xgMe)  : null,
    possession_me: possessionMe !== '' ? parseInt(possessionMe) : null,
    goals_me:      goalsMe,
    goals_opp:     goalsOpp,
    pk_me:         pkMe !== '' ? parseInt(pkMe) : null,
    pk_opp:        pkOpp !== '' ? parseInt(pkOpp) : null,
    ping,
    match_end_type: matchEndType,
    rage_quit:     rageQuit,
  };
  const autoDiff  = calcAutoDifficulty(diffInput);
  const diffLabel = getDifficultyLabel(autoDiff);

  const previewResult =
    pkMe !== '' && pkOpp !== ''
      ? parseInt(pkMe) > parseInt(pkOpp) ? 'W' : parseInt(pkMe) < parseInt(pkOpp) ? 'L' : 'D'
      : goalsMe > goalsOpp ? 'W' : goalsMe < goalsOpp ? 'L' : 'D';
  const previewEloChange = calcEloChange(previewResult, autoDiff);
  const { tierKey: currentTierKey, color: tierColor }    = getEloTier(currentElo);
  const { tierKey: newTierKey,     color: newTierColor } = getEloTier(currentElo + previewEloChange);

  function togglePlayer(player: SquadPlayer) {
    setPlayerEntries(prev => {
      const exists = prev.find(e => e.player.id === player.id);
      if (exists) return prev.filter(e => e.player.id !== player.id);
      return [...prev, { player, goals: 0, assists: 0, motm: false, clean_sheet: false, saves: 0 }];
    });
  }

  function updateEntry(playerId: string, field: keyof Omit<PlayerEntry, 'player'>, value: number | boolean) {
    setPlayerEntries(prev => prev.map(e => e.player.id === playerId ? { ...e, [field]: value } : e));
  }

  function adjustCounter(playerId: string, field: 'goals' | 'assists' | 'saves', delta: number) {
    setPlayerEntries(prev =>
      prev.map(e => {
        if (e.player.id !== playerId) return e;
        return { ...e, [field]: Math.max(0, (e[field] as number) + delta) };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveWeekId = activeWl ?? weekId.trim();
    if (!effectiveWeekId) { setError(t('fill_week_id', lang)); return; }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError(t('session_expired', lang)); setSaving(false); return; }

    const eloChange = calcEloChange(previewResult, autoDiff);
    const eloAfter  = currentElo + eloChange;
    const legacyDifficulty = autoDiff <= 2.5 ? 'Easy' : autoDiff <= 5.0 ? 'Medium' : autoDiff <= 7.5 ? 'Hard' : 'Sweaty';

    const { data: matchData, error: matchError } = await supabase.from('matches').insert({
      user_id: user.id, week_id: effectiveWeekId, match_num: matchNum, ha,
      goals_me: goalsMe, goals_opp: goalsOpp,
      pk_me: pkMe !== '' ? parseInt(pkMe) : null, pk_opp: pkOpp !== '' ? parseInt(pkOpp) : null,
      xg_me: xgMe !== '' ? parseFloat(xgMe) : null, xg_opp: xgOpp !== '' ? parseFloat(xgOpp) : null,
      formation_me: formationMe, formation_opp: formationOpp,
      possession_me: possessionMe !== '' ? parseInt(possessionMe) : null,
      shots_me: shotsMe !== '' ? parseInt(shotsMe) : null,
      ping, difficulty: legacyDifficulty, auto_difficulty: autoDiff, match_end_type: matchEndType,
      rage_quit: rageQuit, platform, gamertag: gamertag.trim(), notes: notes.trim() || null,
      elo_before: currentElo, elo_after: eloAfter, elo_change: eloChange,
    }).select().single();

    if (matchError || !matchData) { setError(matchError?.message || 'Erro ao salvar partida.'); setSaving(false); return; }

    if (playerEntries.length > 0) {
      const mpRows = playerEntries.map(e => ({
        user_id: user.id, match_id: matchData.id, player_id: e.player.id,
        goals: e.goals, assists: e.assists, motm: e.motm, clean_sheet: e.clean_sheet, saves: e.saves,
      }));
      const { error: mpError } = await supabase.from('match_players').insert(mpRows);
      if (mpError) { setError(mpError.message); setSaving(false); return; }
    }
    router.push('/dashboard');
    router.refresh();
  }

  const pingColor = {
    Bom:   'border-green-500 text-green-400',
    Médio: 'border-yellow-500 text-yellow-400',
    Lag:   'border-red-500 text-red-400',
  };

  type EndKey = 'end_normal' | 'end_extra_time' | 'end_penalties' | 'end_abandoned';
  const endTypeConfig: Record<MatchEndType, { labelKey: EndKey; emoji: string; color: string }> = {
    normal:     { labelKey: 'end_normal',     emoji: '⏱',  color: 'border-white text-white'           },
    extra_time: { labelKey: 'end_extra_time', emoji: '⏰',  color: 'border-blue-400 text-blue-400'     },
    penalties:  { labelKey: 'end_penalties',  emoji: '🥅',  color: 'border-purple-400 text-purple-400' },
    abandoned:  { labelKey: 'end_abandoned',  emoji: '🚪',  color: 'border-gray-500 text-gray-400'     },
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t('register_title', lang)}</h1>

        {/* Week ID + Match Num */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{t('week_id', lang)}</label>
            {activeWl ? (
              <div className="w-full bg-[#1a1a1a] border border-[#FFB800]/40 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-[#FFB800] font-semibold">{activeWl}</span>
                <span className="text-gray-500 text-xs ml-auto">{t('wl_active', lang)}</span>
              </div>
            ) : (
              <input type="text" value={weekId} onChange={e => setWeekId(e.target.value)}
                placeholder={t('week_id_hint', lang)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white placeholder:text-gray-600" required />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{t('match_num', lang)}</label>
            <select value={matchNum} onChange={e => setMatchNum(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white">
              {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{t('match_num', lang)}{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Home / Away */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('home', lang)} / {t('away', lang)}</label>
          <div className="flex gap-3">
            {(['Home', 'Away'] as const).map(v => (
              <button key={v} type="button" onClick={() => setHa(v)}
                className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition ${
                  ha === v ? 'border-white bg-white/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}>
                {v === 'Home' ? `🏠 ${t('home', lang)}` : `✈️ ${t('away', lang)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">{t('score', lang)}</p>
          <div className="flex items-center justify-center gap-6">
            {[
              { label: t('my_goals', lang),  val: goalsMe,  set: setGoalsMe,  color: 'text-white'   },
              { label: t('opp_goals', lang), val: goalsOpp, set: setGoalsOpp, color: 'text-red-400' },
            ].map(({ label, val, set, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{label}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set(Math.max(0, val - 1))}
                    className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Minus size={14} /></button>
                  <span className={`text-4xl font-black w-12 text-center ${color}`}>{val}</span>
                  <button type="button" onClick={() => set(val + 1)}
                    className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Plus size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            {[
              { label: t('my_pens', lang),  val: pkMe,  set: setPkMe  },
              { label: t('opp_pens', lang), val: pkOpp, set: setPkOpp },
            ].map(({ label, val, set }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-gray-500">{label}</label>
                <input type="number" min="0" value={val} onChange={e => set(e.target.value)}
                  placeholder="—"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Match end type */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('how_ended', lang)}</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(endTypeConfig) as [MatchEndType, typeof endTypeConfig[MatchEndType]][]).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => setMatchEndType(key)}
                className={`py-2 rounded-xl border text-sm font-semibold transition ${
                  matchEndType === key ? cfg.color + ' bg-white/5' : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}>
                {cfg.emoji} {t(cfg.labelKey, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Ping */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('connection', lang)}</label>
          <div className="flex gap-3">
            {(['Bom', 'Médio', 'Lag'] as const).map(p => (
              <button key={p} type="button" onClick={() => setPing(p)}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${
                  ping === p ? pingColor[p] + ' bg-white/5' : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}>
                {p === 'Bom' ? `🟢 ${t('ping_good', lang)}` : p === 'Médio' ? `🟡 ${t('ping_avg', lang)}` : `🔴 ${t('ping_lag', lang)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Rage Quit */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('rage_quit', lang)}</label>
          <div className="flex gap-3">
            {(['No', 'Opp', 'Me'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRageQuit(r)}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${
                  rageQuit === r
                    ? r === 'No' ? 'border-white text-white bg-white/10'
                      : r === 'Opp' ? 'border-green-400 text-green-400 bg-green-400/10'
                      : 'border-red-400 text-red-400 bg-red-400/10'
                    : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}>
                {r === 'No' ? t('rq_no', lang) : r === 'Opp' ? t('rq_opp', lang) : t('rq_me', lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Platform + Gamertag */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{t('platform', lang)}</label>
            <select value={platform} onChange={e => setPlatform(e.target.value as 'PlayStation' | 'Xbox' | 'PC')}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white">
              <option>PlayStation</option><option>Xbox</option><option>PC</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{t('opponent_tag', lang)}</label>
            <input type="text" value={gamertag} onChange={e => setGamertag(e.target.value)}
              placeholder="NomeDoOponente"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder:text-gray-600" />
          </div>
        </div>

        {/* Advanced Stats */}
        <button type="button" onClick={() => setShowAdvanced(v => !v)}
          className="w-full flex items-center justify-between bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 hover:border-white/20 transition">
          <span>{t('advanced_metrics', lang)}</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('xg_mine', lang)}</label>
                <input type="number" step="0.1" min="0" value={xgMe} onChange={e => setXgMe(e.target.value)} placeholder="1.4"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('xg_opp', lang)}</label>
                <input type="number" step="0.1" min="0" value={xgOpp} onChange={e => setXgOpp(e.target.value)} placeholder="0.8"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('my_formation', lang)}</label>
                <select value={formationMe} onChange={e => setFormationMe(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white">
                  {FORMATIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('opp_formation', lang)}</label>
                <select value={formationOpp} onChange={e => setFormationOpp(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white">
                  {FORMATIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('my_possession', lang)}</label>
                <input type="number" min="0" max="100" value={possessionMe} onChange={e => setPossessionMe(e.target.value)} placeholder="55"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('my_shots', lang)}</label>
                <input type="number" min="0" value={shotsMe} onChange={e => setShotsMe(e.target.value)} placeholder="12"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-700" />
              </div>
            </div>
          </div>
        )}

        {/* AUTO DIFFICULTY CARD */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-[#FFB800]" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t('auto_diff', lang)}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-[#262626] rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-300 ${
                    autoDiff <= 2.5 ? 'bg-green-500' : autoDiff <= 4.5 ? 'bg-yellow-500' :
                    autoDiff <= 6.5 ? 'bg-orange-500' : autoDiff <= 8.5 ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${(autoDiff / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600">1</span>
                <span className="text-[10px] text-gray-600">10</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${diffLabel.color}`}>{autoDiff.toFixed(1)}</p>
              <p className={`text-xs font-semibold ${diffLabel.color}`}>{diffLabel.label}</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 mt-2">{t('diff_tooltip', lang)}</p>
        </div>

        {/* ELO PREVIEW */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{t('elo_impact', lang)}</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className={`text-lg font-black ${tierColor}`}>{currentElo}</p>
              <p className={`text-xs ${tierColor}`}>{t(currentTierKey as Parameters<typeof t>[0], lang)}</p>
            </div>
            <div className={`text-2xl font-black ${previewEloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {previewEloChange >= 0 ? '+' : ''}{previewEloChange}
            </div>
            <div className="text-center">
              <p className={`text-lg font-black ${newTierColor}`}>{currentElo + previewEloChange}</p>
              <p className={`text-xs ${newTierColor}`}>{t(newTierKey as Parameters<typeof t>[0], lang)}</p>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('player_stats', lang)}</h2>
          {squad.length === 0 ? (
            <p className="text-sm text-gray-500 bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
              {t('squad_empty_hint', lang)}{' '}
              <a href="/squad" className="text-white underline">{t('add_to_squad', lang)}</a>{' '}
              {t('squad_empty_hint2', lang)}
            </p>
          ) : (
            <div className="space-y-2">
              {squad.map(player => {
                const entry  = playerEntries.find(e => e.player.id === player.id);
                const active = !!entry;
                const isGK   = player.position === 'GK';
                return (
                  <div key={player.id}
                    className={`rounded-xl border transition ${active ? 'border-white/30 bg-white/5' : 'border-white/10 bg-[#1a1a1a]'}`}>
                    <button type="button" onClick={() => togglePlayer(player)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-white/20'}`} />
                      <span className="text-xs text-gray-500 w-10 text-center border border-white/10 rounded px-1 py-0.5">{player.position}</span>
                      <span className={`flex-1 text-sm font-medium ${active ? 'text-white' : 'text-gray-400'}`}>{player.name}</span>
                      <span className={`text-xs ${active ? 'text-white' : 'text-gray-600'}`}>
                        {active ? t('remove', lang) : t('add', lang)}
                      </span>
                    </button>
                    {active && entry && (
                      <div className="px-4 pb-4 space-y-3">
                        {!isGK && (
                          <div className="flex gap-6 flex-wrap">
                            {(['goals', 'assists'] as const).map(field => (
                              <div key={field} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-14">
                                  {field === 'goals' ? `⚽ ${t('goals', lang)}` : `🎯 ${t('assists', lang)}`}
                                </span>
                                <button type="button" onClick={() => adjustCounter(player.id, field, -1)}
                                  className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Minus size={12} /></button>
                                <span className={`w-6 text-center font-bold ${field === 'goals' ? 'text-white' : 'text-blue-400'}`}>{entry[field]}</span>
                                <button type="button" onClick={() => adjustCounter(player.id, field, 1)}
                                  className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Plus size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {isGK && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-16">🧤 {t('saves', lang)}</span>
                            <button type="button" onClick={() => adjustCounter(player.id, 'saves', -1)}
                              className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Minus size={12} /></button>
                            <span className="w-6 text-center font-bold text-cyan-400">{entry.saves}</span>
                            <button type="button" onClick={() => adjustCounter(player.id, 'saves', 1)}
                              className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center hover:bg-[#333]"><Plus size={12} /></button>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button type="button" onClick={() => updateEntry(player.id, 'motm', !entry.motm)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                              entry.motm ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/10 text-gray-500 hover:border-white/20'
                            }`}><Star size={12} fill={entry.motm ? 'currentColor' : 'none'} /> {t('motm', lang)}</button>
                          <button type="button" onClick={() => updateEntry(player.id, 'clean_sheet', !entry.clean_sheet)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                              entry.clean_sheet ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-gray-500 hover:border-white/20'
                            }`}><Shield size={12} fill={entry.clean_sheet ? 'currentColor' : 'none'} /> {t('clean_sheet', lang)}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('notes', lang)}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="..."
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white resize-none placeholder:text-gray-600" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#FFB800] text-black font-black py-4 rounded-2xl text-lg hover:bg-[#CC9400] transition disabled:opacity-50">
          {saving ? <Loader2 size={20} className="animate-spin" /> : null}
          {saving ? t('saving', lang) : t('register_match', lang)}
        </button>
      </div>
    </form>
  );
}

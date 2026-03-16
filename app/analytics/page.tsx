'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, getMatchResult } from '@/types';
import { Loader2, BarChart2, Target, Clock, Swords, Crown, Lock, Zap, Shield, TrendingUp } from 'lucide-react';
import { formationStats, firstGoalImpact } from '@/lib/insights';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, Legend
} from 'recharts';
import { useLanguage } from '@/components/LanguageProvider';
import { t, tDays } from '@/lib/i18n';
import { usePlan } from '@/hooks/usePlan';

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const { isPremium } = usePlan();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('matches').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMatches(data as Match[]); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-white" size={36} />
    </div>
  );

  if (matches.length === 0) return (
    <div className="min-h-screen bg-background text-white p-4 flex flex-col items-center justify-center gap-4">
      <BarChart2 size={48} className="opacity-20" />
      <p className="text-[#94A3B8]">{t('no_data', lang)}</p>
    </div>
  );

  // ─── 0. Formation Performance (own formations) ───────────────────────
  const myFormationStats = formationStats(matches).slice(0, 6);
  const myFormChartData  = myFormationStats.map(f => ({
    name: f.formation,
    'Win Rate': parseFloat(f.winRate.toFixed(1)),
    'Avg Goals': parseFloat(f.avgGoalsFor.toFixed(1)),
  }));

  // ─── 0b. First Goal Impact ────────────────────────────────────────────
  const fgImpact = firstGoalImpact(matches);

  // ─── 1. XG vs Actual Goals ────────────────────────────────────────────
  const xgData = matches
    .filter(m => m.xg_me !== null && m.xg_opp !== null)
    .map((m, i) => ({
      name:    `#${i + 1}`,
      xgMe:    m.xg_me,
      xgOpp:   m.xg_opp,
      goalsMe:  m.goals_me,
      goalsOpp: m.goals_opp,
    }));

  // ─── 2. Win rate by day of week ───────────────────────────────────────
  const dayNames = tDays(lang);
  const dayStats: Record<number, { wins: number; total: number }> = {};
  for (let i = 0; i < 7; i++) dayStats[i] = { wins: 0, total: 0 };
  matches.forEach(m => {
    const day = new Date(m.created_at).getDay();
    dayStats[day].total++;
    if (getMatchResult(m) === 'W') dayStats[day].wins++;
  });
  const dayData = dayNames.map((name, i) => ({
    name,
    winRate: dayStats[i].total > 0 ? Math.round((dayStats[i].wins / dayStats[i].total) * 100) : 0,
    total:   dayStats[i].total,
  }));

  // ─── 3. Formation kryptonite ──────────────────────────────────────────
  const formMap: Record<string, { wins: number; losses: number; draws: number }> = {};
  matches.forEach(m => {
    const f = m.formation_opp || '?';
    if (!formMap[f]) formMap[f] = { wins: 0, losses: 0, draws: 0 };
    const r = getMatchResult(m);
    if (r === 'W') formMap[f].wins++;
    else if (r === 'L') formMap[f].losses++;
    else formMap[f].draws++;
  });
  const formData = Object.entries(formMap)
    .map(([name, s]) => ({
      name, total: s.wins + s.losses + s.draws,
      winRate: s.wins + s.losses + s.draws > 0 ? Math.round((s.wins / (s.wins + s.losses + s.draws)) * 100) : 0,
      wins: s.wins, losses: s.losses, draws: s.draws,
    }))
    .filter(f => f.total >= 2)
    .sort((a, b) => a.winRate - b.winRate);
  const kryptonite = formData[0];

  // ─── 4. ELO progression ───────────────────────────────────────────────
  const eloData = matches.filter(m => m.elo_after !== null).map((m, i) => ({ name: `#${i + 1}`, elo: m.elo_after }));

  // ─── 5. Clutch stats ──────────────────────────────────────────────────
  const closeMatches = matches.filter(m => Math.abs(m.goals_me - m.goals_opp) <= 1 || m.pk_me !== null);
  const clutchW = closeMatches.filter(m => getMatchResult(m) === 'W').length;
  const clutchL = closeMatches.filter(m => getMatchResult(m) === 'L').length;
  const clutchD = closeMatches.filter(m => getMatchResult(m) === 'D').length;
  const clutchTotal = closeMatches.length;

  // ─── 6. Goals rolling avg ─────────────────────────────────────────────
  const avgScoredKey   = t('avg_scored_chart', lang);
  const avgConcededKey = t('avg_conceded_chart', lang);
  const trendData = matches.map((m, i) => {
    const window = matches.slice(Math.max(0, i - 4), i + 1);
    const avgFor  = window.reduce((s, x) => s + x.goals_me,  0) / window.length;
    const avgAg   = window.reduce((s, x) => s + x.goals_opp, 0) / window.length;
    return {
      name: `#${i + 1}`,
      [avgScoredKey]:   parseFloat(avgFor.toFixed(2)),
      [avgConcededKey]: parseFloat(avgAg.toFixed(2)),
    };
  });

  // ─── 7. Difficulty distribution ───────────────────────────────────────
  const diffBuckets = [
    { label: '1–2', range: [1, 2.9],  wins: 0, total: 0 },
    { label: '3–4', range: [3, 4.9],  wins: 0, total: 0 },
    { label: '5–6', range: [5, 6.9],  wins: 0, total: 0 },
    { label: '7–8', range: [7, 8.9],  wins: 0, total: 0 },
    { label: '9–10',range: [9, 10],   wins: 0, total: 0 },
  ];
  matches.forEach(m => {
    if (m.auto_difficulty === null) return;
    const b = diffBuckets.find(b => m.auto_difficulty! >= b.range[0] && m.auto_difficulty! <= b.range[1]);
    if (!b) return;
    b.total++;
    if (getMatchResult(m) === 'W') b.wins++;
  });
  const diffData = diffBuckets.map(b => ({
    name:    b.label,
    winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0,
    total:   b.total,
  }));

  const GOLD  = '#FFB800';
  const RED   = '#ef4444';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-[#273246] rounded-xl px-3 py-2 text-xs">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-black">{t('analytics_title', lang)}</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">{t('insights', lang)} {matches.length} {t('matches', lang)}</p>
        </div>

        {/* ── My Formation Performance ── */}
        {myFormChartData.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">My Formation Performance</h2>
            </div>
            <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
              {/* Best/worst quick summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Best</p>
                  <p className="text-base font-black text-white">{myFormationStats[0]?.formation}</p>
                  <p className="text-xs text-emerald-400 font-bold">{myFormationStats[0]?.winRate.toFixed(0)}% WR</p>
                </div>
                {myFormationStats.length > 1 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">Worst</p>
                    <p className="text-base font-black text-white">{myFormationStats[myFormationStats.length - 1]?.formation}</p>
                    <p className="text-xs text-red-400 font-bold">{myFormationStats[myFormationStats.length - 1]?.winRate.toFixed(0)}% WR</p>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={myFormChartData.length * 36 + 20}>
                <BarChart data={myFormChartData} layout="vertical" margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={56} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Win Rate" radius={[0, 6, 6, 0]}>
                    {myFormChartData.map((entry, i) => (
                      <Cell key={i} fill={entry['Win Rate'] >= 55 ? '#10B981' : entry['Win Rate'] >= 40 ? '#F59E0B' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── First Goal Impact ── */}
        {(fgImpact.scoredFirst + fgImpact.concededFirst) >= 5 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">First Goal Impact</h2>
            </div>
            <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide mb-1">Scored First</p>
                  <p className="text-3xl font-black text-emerald-400">{fgImpact.scoredFirstWinRate.toFixed(0)}%</p>
                  <p className="text-xs text-[#64748B] mt-1">win rate</p>
                  <p className="text-[10px] text-[#64748B]">{fgImpact.scoredFirst} matches</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mb-1">Conceded First</p>
                  <p className="text-3xl font-black text-red-400">{fgImpact.concededFirstWinRate.toFixed(0)}%</p>
                  <p className="text-xs text-[#64748B] mt-1">win rate</p>
                  <p className="text-[10px] text-[#64748B]">{fgImpact.concededFirst} matches</p>
                </div>
              </div>
              {Math.abs(fgImpact.scoredFirstWinRate - fgImpact.concededFirstWinRate) > 20 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <Zap size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#94A3B8]">
                    {fgImpact.scoredFirstWinRate > fgImpact.concededFirstWinRate
                      ? `Scoring first gives you a ${(fgImpact.scoredFirstWinRate - fgImpact.concededFirstWinRate).toFixed(0)}pp win rate advantage — early pressure is key.`
                      : `Your comeback rate is stronger than average. You perform well under pressure.`
                    }
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Clutch stats ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('clutch_title', lang)}</h2>
          </div>
          <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
            <p className="text-xs text-[#94A3B8]">{clutchTotal} {t('close_matches', lang)}</p>
            <div className="flex gap-4 text-center">
              <div className="flex-1">
                <p className="text-2xl font-black text-green-400">{clutchW}</p>
                <p className="text-xs text-[#94A3B8]">{t('wins', lang)}</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-yellow-400">{clutchD}</p>
                <p className="text-xs text-[#94A3B8]">{t('draws', lang)}</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-red-400">{clutchL}</p>
                <p className="text-xs text-[#94A3B8]">{t('losses', lang)}</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">
                  {clutchTotal > 0 ? Math.round((clutchW / clutchTotal) * 100) : 0}%
                </p>
                <p className="text-xs text-[#94A3B8]">{t('clutch_wr', lang)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ELO Progression ── */}
        {eloData.length > 1 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('elo_progress', lang)}</h2>
            </div>
            <div className="bg-card border border-[#273246] rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={eloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="elo" name="ELO" stroke={GOLD} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Win rate by day ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('wr_by_day', lang)}</h2>
          </div>
          <div className="bg-card border border-[#273246] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="winRate" name={t('win_rate', lang)}>
                  {dayData.map((entry, i) => (
                    <Cell key={i} fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-3 pt-3 border-t border-[#273246]/50 text-xs">
              {(() => {
                const played = dayData.filter(d => d.total > 0);
                if (!played.length) return null;
                const best  = played.reduce((a, b) => b.winRate > a.winRate ? b : a);
                const worst = played.reduce((a, b) => b.winRate < a.winRate ? b : a);
                return (
                  <>
                    <span><span className="text-green-400 font-bold">{t('best_day', lang)}</span> <span className="text-white">{best.name} ({best.winRate}%)</span></span>
                    <span><span className="text-red-400 font-bold">{t('worst_day', lang)}</span> <span className="text-white">{worst.name} ({worst.winRate}%)</span></span>
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── Formation Kryptonite ── */}
        {formData.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('kryptonite', lang)}</h2>
            </div>
            <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
              {kryptonite && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <span className="text-2xl">😨</span>
                  <div>
                    <p className="font-bold text-red-400">{kryptonite.name}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {kryptonite.wins}{t('wins', lang).charAt(0)} {kryptonite.draws}{t('draws', lang).charAt(0)} {kryptonite.losses}{t('losses', lang).charAt(0)} —{' '}
                      <span className="text-red-400 font-bold">{kryptonite.winRate}% {t('win_rate', lang)}</span>
                    </p>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={formData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="winRate" name={`${t('win_rate', lang)} %`}>
                    {formData.map((entry, i) => (
                      <Cell key={i} fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Win rate by difficulty ── */}
        {matches.some(m => m.auto_difficulty !== null) && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('wr_by_diff', lang)}</h2>
            </div>
            <div className="bg-card border border-[#273246] rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={diffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="winRate" name={`${t('win_rate', lang)} %`}>
                    {diffData.map((entry, i) => (
                      <Cell key={i} fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── xG vs Goals (Premium) ── */}
        {xgData.length >= 3 && (
          isPremium ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('xg_vs_goals', lang)}</h2>
              </div>
              <div className="bg-card border border-[#273246] rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={xgData.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="xgMe"    name={t('xg_mine', lang)}   fill="#FFB80060" />
                    <Bar dataKey="goalsMe" name={t('my_goals', lang)}  fill={GOLD} />
                    <Bar dataKey="xgOpp"   name={t('xg_opp', lang)}    fill="#ef444460" />
                    <Bar dataKey="goalsOpp" name={t('opp_goals', lang)} fill={RED} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <div className="bg-card border border-amber-500/20 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lock size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Crown size={12} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Premium Feature</span>
                </div>
                <p className="font-semibold text-white text-sm">xG Analytics</p>
                <p className="text-xs text-[#64748B] mt-0.5">Compare expected goals vs actual performance</p>
              </div>
            </div>
          )
        )}

        {/* ── Goals per game trend (Premium) ── */}
        {trendData.length >= 5 && (
          isPremium ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('goals_trend', lang)}</h2>
              </div>
              <div className="bg-card border border-[#273246] rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey={avgScoredKey}   stroke={GOLD} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey={avgConcededKey} stroke={RED}  strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <div className="bg-card border border-amber-500/20 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lock size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Crown size={12} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Premium Feature</span>
                </div>
                <p className="font-semibold text-white text-sm">Goals Trend</p>
                <p className="text-xs text-[#64748B] mt-0.5">Track scoring patterns over time</p>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
}

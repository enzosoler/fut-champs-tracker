'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, getMatchResult } from '@/types';
import { Loader2, BarChart2, Target, Clock, Swords } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, Legend
} from 'recharts';
import { useLanguage } from '@/components/LanguageProvider';
import { t, tDays } from '@/lib/i18n';

export default function AnalyticsPage() {
  const { lang } = useLanguage();
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

        {/* ── xG vs Goals ── */}
        {xgData.length >= 3 && (
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
        )}

        {/* ── Goals per game trend ── */}
        {trendData.length >= 5 && (
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
        )}

      </div>
    </div>
  );
}

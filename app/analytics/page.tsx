'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, getMatchResult } from '@/types';
import { Loader2, BarChart2, Target, Clock, Swords } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, ScatterChart, Scatter, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMatches(data as Match[]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={36} />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white p-4 flex flex-col items-center justify-center gap-4">
        <BarChart2 size={48} className="opacity-20" />
        <p className="text-gray-500">Registre partidas para ver análises aqui.</p>
      </div>
    );
  }

  // ─── 1. XG vs Actual Goals ───────────────────────────────────────────
  const xgData = matches
    .filter(m => m.xg_me !== null && m.xg_opp !== null)
    .map((m, i) => ({
      name: `#${i + 1}`,
      'xG Meu':      m.xg_me,
      'xG Opp':      m.xg_opp,
      'Gols Meus':   m.goals_me,
      'Gols Opp':    m.goals_opp,
    }));

  // ─── 2. Win rate by day of week ───────────────────────────────────────
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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

  // ─── 3. Formation kryptonite ─────────────────────────────────────────
  const formMap: Record<string, { wins: number; losses: number; draws: number }> = {};
  matches.forEach(m => {
    const f = m.formation_opp || 'Desconhecida';
    if (!formMap[f]) formMap[f] = { wins: 0, losses: 0, draws: 0 };
    const r = getMatchResult(m);
    if (r === 'W') formMap[f].wins++;
    else if (r === 'L') formMap[f].losses++;
    else formMap[f].draws++;
  });
  const formData = Object.entries(formMap)
    .map(([name, s]) => ({
      name,
      total: s.wins + s.losses + s.draws,
      winRate: s.wins + s.losses + s.draws > 0
        ? Math.round((s.wins / (s.wins + s.losses + s.draws)) * 100) : 0,
      wins: s.wins, losses: s.losses, draws: s.draws,
    }))
    .filter(f => f.total >= 2)
    .sort((a, b) => a.winRate - b.winRate);

  const kryptonite = formData[0]; // lowest win rate formation

  // ─── 4. ELO progression ──────────────────────────────────────────────
  const eloData = matches
    .filter(m => m.elo_after !== null)
    .map((m, i) => ({
      name: `#${i + 1}`,
      elo: m.elo_after,
    }));

  // ─── 5. Clutch stats (close games = margin of 1 goal or penalties) ───
  const closeMatches = matches.filter(m =>
    Math.abs(m.goals_me - m.goals_opp) <= 1 || m.pk_me !== null
  );
  const clutchW = closeMatches.filter(m => getMatchResult(m) === 'W').length;
  const clutchL = closeMatches.filter(m => getMatchResult(m) === 'L').length;
  const clutchD = closeMatches.filter(m => getMatchResult(m) === 'D').length;
  const clutchTotal = closeMatches.length;

  // ─── 6. Goals per game trend (rolling 5-game avg) ────────────────────
  const trendData = matches.map((m, i) => {
    const window = matches.slice(Math.max(0, i - 4), i + 1);
    const avgFor  = window.reduce((s, x) => s + x.goals_me,  0) / window.length;
    const avgAg   = window.reduce((s, x) => s + x.goals_opp, 0) / window.length;
    return {
      name:     `#${i + 1}`,
      'Média Marcados':  parseFloat(avgFor.toFixed(2)),
      'Média Sofridos':  parseFloat(avgAg.toFixed(2)),
    };
  });

  // ─── 7. Difficulty distribution ──────────────────────────────────────
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
  const GRAY  = '#6b7280';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-black">Análises</h1>
          <p className="text-sm text-gray-400 mt-0.5">Insights baseados em {matches.length} partidas</p>
        </div>

        {/* ── Clutch stats ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-[#FFB800]" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Clutch (Partidas Disputadas)</h2>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-gray-500">{clutchTotal} partidas com margem ≤ 1 gol ou nos penaltis</p>
            <div className="flex gap-4 text-center">
              <div className="flex-1">
                <p className="text-2xl font-black text-green-400">{clutchW}</p>
                <p className="text-xs text-gray-400">Vitorias</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-yellow-400">{clutchD}</p>
                <p className="text-xs text-gray-400">Empates</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-red-400">{clutchL}</p>
                <p className="text-xs text-gray-400">Derrotas</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">
                  {clutchTotal > 0 ? Math.round((clutchW / clutchTotal) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400">Clutch WR</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ELO Progression ── */}
        {eloData.length > 1 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evolução do ELO</h2>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={eloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="elo" stroke={GOLD} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Win rate by day ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#FFB800]" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Win Rate por Dia da Semana</h2>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="winRate" name="Win Rate %">
                  {dayData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Best/worst day */}
            <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-xs">
              {(() => {
                const played = dayData.filter(d => d.total > 0);
                if (!played.length) return null;
                const best  = played.reduce((a, b) => b.winRate > a.winRate ? b : a);
                const worst = played.reduce((a, b) => b.winRate < a.winRate ? b : a);
                return (
                  <>
                    <span><span className="text-green-400 font-bold">Melhor:</span> <span className="text-white">{best.name} ({best.winRate}%)</span></span>
                    <span><span className="text-red-400 font-bold">Pior:</span> <span className="text-white">{worst.name} ({worst.winRate}%)</span></span>
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
              <Swords size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Formação Kryptonite</h2>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 space-y-3">
              {kryptonite && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <span className="text-2xl">😨</span>
                  <div>
                    <p className="font-bold text-red-400">{kryptonite.name}</p>
                    <p className="text-xs text-gray-400">
                      {kryptonite.wins}V {kryptonite.draws}E {kryptonite.losses}D —{' '}
                      <span className="text-red-400 font-bold">{kryptonite.winRate}% win rate</span>
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
                  <Bar dataKey="winRate" name="Win Rate %">
                    {formData.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED}
                      />
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
              <BarChart2 size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Win Rate por Dificuldade</h2>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={diffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="winRate" name="Win Rate %">
                    {diffData.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? GOLD : RED}
                      />
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
              <Target size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">xG vs Gols Reais</h2>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-3">Últimas {xgData.length} partidas com xG registrado</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={xgData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="xG Meu"    fill="#FFB80060" />
                  <Bar dataKey="Gols Meus" fill={GOLD} />
                  <Bar dataKey="xG Opp"    fill="#ef444460" />
                  <Bar dataKey="Gols Opp"  fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Goals per game trend ── */}
        {trendData.length >= 5 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tendência (Média Móvel 5 jogos)</h2>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Média Marcados" stroke={GOLD} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Média Sofridos" stroke={RED}  strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Match } from '@/types';
import {
  generateInsights, formationStats, firstGoalImpact, clutchStats,
  fatigueStats, xgStats, consistencyStats, type Insight, type InsightSeverity,
} from '@/lib/insights';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, Shield, Target, Zap, Clock, BarChart2, Swords, ChevronRight,
  Star, Flame, Trophy, RefreshCw, Loader2,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell,
} from 'recharts';

const SEVERITY_CONFIG: Record<InsightSeverity, { color: string; bg: string; border: string; Icon: React.ElementType }> = {
  critical:  { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    Icon: AlertTriangle },
  warning:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  Icon: AlertTriangle },
  positive:  { color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',Icon: CheckCircle   },
  info:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   Icon: Info          },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  formation:   Swords,
  first_goal:  Zap,
  clutch:      Flame,
  fatigue:     Clock,
  scoring:     Target,
  defending:   Shield,
  consistency: TrendingUp,
  comeback:    TrendingUp,
  xg:          BarChart2,
  general:     Star,
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity];
  const TypeIcon = TYPE_ICON[insight.type] ?? Info;

  return (
    <div
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className={`mt-0.5 w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
          <cfg.Icon size={15} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
              {insight.severity}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wide flex items-center gap-1">
              <TypeIcon size={9} /> {insight.type.replace('_', ' ')}
            </span>
            {insight.metricValue && (
              <span className={`text-[10px] font-bold font-mono ml-auto ${cfg.color}`}>
                {insight.metricValue}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white mt-0.5 leading-snug">{insight.title}</p>
        </div>
        <ChevronRight size={14} className={`text-[#64748B] flex-shrink-0 transition-transform mt-1 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-sm text-[#94A3B8] leading-relaxed">{insight.description}</p>
          <div className={`rounded-xl p-3 flex gap-2.5 ${cfg.bg} border ${cfg.border}`}>
            <Lightbulb size={14} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
            <p className="text-xs text-white leading-relaxed">{insight.recommendation}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#64748B]">Confidence:</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${insight.confidence > 0.7 ? 'bg-emerald-400' : insight.confidence > 0.4 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${insight.confidence * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748B]">{(insight.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-[#273246] rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-xs text-[#64748B] uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#64748B]">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-[#273246] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.name.includes('Rate') || p.name.includes('rate') || p.name.includes('%') ? '%' : ''}</span></p>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<InsightSeverity | 'all'>('all');

  useEffect(() => {
    supabase.from('matches').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMatches(data as Match[]); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  if (matches.length < 5) return (
    <div className="px-4 pt-6 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Lightbulb size={28} className="text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white font-heading">Insights</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Log at least 5 matches to unlock AI-powered insights about your game.</p>
      </div>
      <div className="text-xs text-[#64748B] bg-card border border-[#273246] rounded-xl px-4 py-2">
        {matches.length} / 5 matches tracked
      </div>
    </div>
  );

  const insights = generateInsights(matches);
  const fStats = formationStats(matches);
  const fg = firstGoalImpact(matches);
  const cl = clutchStats(matches);
  const fat = fatigueStats(matches);
  const xg = xgStats(matches);
  const cons = consistencyStats(matches);

  const filtered = activeFilter === 'all' ? insights : insights.filter(i => i.severity === activeFilter);
  const counts = {
    critical: insights.filter(i => i.severity === 'critical').length,
    warning:  insights.filter(i => i.severity === 'warning').length,
    positive: insights.filter(i => i.severity === 'positive').length,
  };

  // Formation chart data
  const formationChartData = fStats.slice(0, 5).map(f => ({
    name: f.formation,
    'Win Rate': parseFloat(f.winRate.toFixed(1)),
    'Avg Goals': parseFloat(f.avgGoalsFor.toFixed(1)),
  }));

  // Performance profile radar
  const radarData = [
    { subject: 'Win Rate',   value: Math.min(cons.overallWR, 100) },
    { subject: 'Clutch',     value: cl.closeTotal > 0 ? cl.closeWinRate : 50 },
    { subject: 'Scoring',    value: xg ? Math.min(xg.avgXgMe * 33, 100) : 50 },
    { subject: 'Defense',    value: xg ? Math.max(100 - xg.avgXgOpp * 30, 0) : 50 },
    { subject: 'Form',       value: Math.min(cons.last10WR, 100) },
    { subject: 'Consistency',value: Math.max(100 - cons.maxLossStreak * 10, 0) },
  ];

  // Block performance data
  const blockData = [
    { block: '1–5',   winRate: parseFloat(fat.early.winRate.toFixed(1)), count: fat.early.count },
    { block: '6–10',  winRate: parseFloat(fat.mid.winRate.toFixed(1)),   count: fat.mid.count   },
    { block: '11–15', winRate: parseFloat(fat.late.winRate.toFixed(1)),  count: fat.late.count  },
  ].filter(b => b.count > 0);

  return (
    <div className="px-4 pt-2 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black font-heading text-white flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" />
            Insights
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">{matches.length} matches analyzed</p>
        </div>
        <div className="flex items-center gap-1.5">
          {counts.critical > 0 && (
            <span className="text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-1 rounded-full">
              {counts.critical} critical
            </span>
          )}
          {counts.positive > 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full">
              {counts.positive} positive
            </span>
          )}
        </div>
      </div>

      {/* Performance Profile Radar */}
      <div className="bg-card border border-[#273246] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Performance Profile</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#273246" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="You" dataKey="value"
              stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Overall Win Rate"
          value={`${cons.overallWR.toFixed(0)}%`}
          sub={`${matches.length} matches`}
          color={cons.overallWR >= 50 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          label="Recent Form (L10)"
          value={`${cons.last10WR.toFixed(0)}%`}
          sub={cons.trend >= 0 ? `↑ +${cons.trend.toFixed(0)}pp` : `↓ ${cons.trend.toFixed(0)}pp`}
          color={cons.trend >= 0 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <StatCard
          label="Best Win Streak"
          value={`${cons.maxWinStreak}`}
          sub="consecutive wins"
          color="text-emerald-400"
        />
        <StatCard
          label="Close Game W%"
          value={cl.closeTotal > 0 ? `${cl.closeWinRate.toFixed(0)}%` : '—'}
          sub={`${cl.closeTotal} tight matches`}
          color={cl.closeWinRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>

      {/* Formation Performance */}
      {formationChartData.length > 0 && (
        <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-primary" />
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Formation Win Rates</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={formationChartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Win Rate" radius={[0, 6, 6, 0]}>
                {formationChartData.map((entry, i) => (
                  <Cell key={i} fill={entry['Win Rate'] >= 50 ? '#10B981' : entry['Win Rate'] >= 35 ? '#F59E0B' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* First Goal Impact */}
      {(fg.scoredFirst + fg.concededFirst) >= 5 && (
        <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">First Goal Impact</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{fg.scoredFirstWinRate.toFixed(0)}%</p>
              <p className="text-xs text-[#64748B] mt-0.5">Win rate scoring first</p>
              <p className="text-[10px] text-[#64748B]">{fg.scoredFirst} matches</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-400">{fg.concededFirstWinRate.toFixed(0)}%</p>
              <p className="text-xs text-[#64748B] mt-0.5">Win rate conceding first</p>
              <p className="text-[10px] text-[#64748B]">{fg.concededFirst} matches</p>
            </div>
          </div>
        </div>
      )}

      {/* Match Block Performance */}
      {blockData.length >= 2 && (
        <div className="bg-card border border-[#273246] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Performance by Match Block</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {blockData.map(b => (
              <div key={b.block} className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide font-bold">Match {b.block}</p>
                <p className={`text-lg font-black mt-0.5 ${b.winRate >= 55 ? 'text-emerald-400' : b.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {b.winRate.toFixed(0)}%
                </p>
                <p className="text-[10px] text-[#64748B]">{b.count} games</p>
              </div>
            ))}
          </div>
          {fat.dropOff > 10 && (
            <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1.5">
              <TrendingDown size={12} /> Performance drops {fat.dropOff.toFixed(0)}pp in late matches
            </p>
          )}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
            {insights.length} Insights Found
          </p>
          <div className="flex gap-1">
            {(['all', 'critical', 'warning', 'positive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors capitalize ${
                  activeFilter === f
                    ? 'bg-primary text-white'
                    : 'text-[#64748B] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-sm">
            No {activeFilter} insights found.
          </div>
        ) : (
          filtered.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

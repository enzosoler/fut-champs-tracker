"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Match, ChartPoint } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

// FUT Champions rank tiers based on wins (out of 20 games)
const RANK_TIERS = [
  { minWins: 18, label: "Elite I", color: "#FFD700" },
  { minWins: 15, label: "Elite II", color: "#FFD700" },
  { minWins: 12, label: "Gold I", color: "#ACFF33" },
  { minWins: 9, label: "Gold II", color: "#ACFF33" },
  { minWins: 6, label: "Silver I", color: "#9090A0" },
  { minWins: 3, label: "Silver II", color: "#9090A0" },
  { minWins: 0, label: "Bronze", color: "#CD7F32" },
];

function getRankTier(wins: number) {
  return RANK_TIERS.find((t) => wins >= t.minWins) ?? RANK_TIERS[RANK_TIERS.length - 1];
}

function buildChartData(matches: Match[]): ChartPoint[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return sorted.map((m, i) => {
    const slice = sorted.slice(0, i + 1);
    const wins = slice.filter((x) => x.result === "W").length;
    return {
      game: i + 1,
      winPct: Math.round((wins / (i + 1)) * 100),
    };
  });
}

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) setMatches(data as Match[]);
      setLoading(false);
    }

    fetchMatches();
  }, []);

  const wins = matches.filter((m) => m.result === "W").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const played = wins + losses;
  const gamesRemaining = Math.max(0, 20 - played);
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;
  const goalsFor = matches.reduce((sum, m) => sum + m.goals_for, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.goals_against, 0);
  const rank = getRankTier(wins);
  const chartData = buildChartData(matches);
  const recentMatches = [...matches].reverse().slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando...
        </div>
      </div>
    );
  }

  if (played === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <div className="text-5xl">🎮</div>
        <p className="text-gray-400 text-sm">Nenhuma partida registrada ainda.</p>
        <Link
          href="/add-match"
          className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
        >
          <PlusCircle size={16} />
          Registrar Primeira Partida
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Record + Rank */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                Semana Atual
              </p>
              <p className="text-4xl font-bold tracking-tight">
                <span className="text-win">{wins}V</span>
                <span className="text-gray-600 mx-1">·</span>
                <span className="text-loss">{losses}D</span>
              </p>
            </div>
            <div
              className="text-right border border-border rounded-xl px-3 py-2"
              style={{ borderColor: rank.color + "66" }}
            >
              <p className="text-xs text-gray-500 mb-0.5">Rank Estimado</p>
              <p className="font-bold text-sm" style={{ color: rank.color }}>
                {rank.label}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (wins / 18) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{played} jogos</span>
            <span>{gamesRemaining} restantes</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Win %", value: `${winPct}%`, color: "text-primary" },
          { label: "Gols Pro", value: goalsFor, color: "text-win" },
          { label: "Gols Contra", value: goalsAgainst, color: "text-loss" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência (Win %)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="game"
                    stroke="#444"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#666" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#444"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#666" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#202020",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Win %"]}
                    labelFormatter={(l) => `Jogo #${l}`}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#333"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="winPct"
                    stroke="#ACFF33"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#ACFF33", stroke: "#121212" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent matches */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Partidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2.5"
              >
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    m.result === "W"
                      ? "bg-win/20 text-win"
                      : "bg-loss/20 text-loss"
                  }`}
                >
                  {m.result}
                </span>
                <span className="font-mono font-bold text-lg leading-none">
                  {m.goals_for}–{m.goals_against}
                </span>
                {m.notes && (
                  <span className="text-gray-500 text-xs truncate flex-1">
                    {m.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

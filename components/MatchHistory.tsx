"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/Card";
import { Match } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { PlusCircle, Trash2 } from "lucide-react";

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "W" | "L">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

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
      .order("created_at", { ascending: false });

    if (data) setMatches(data as Match[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deletar esta partida?")) return;
    setDeleting(id);
    await supabase.from("matches").delete().eq("id", id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
    setDeleting(null);
  }

  const filtered =
    filter === "all" ? matches : matches.filter((m) => m.result === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">🎮</div>
        <p className="text-gray-400 text-sm">Nenhuma partida registrada.</p>
        <Link
          href="/add-match"
          className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
        >
          <PlusCircle size={16} />
          Adicionar Primeira Partida
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2">
        {(["all", "W", "L"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f
                ? f === "W"
                  ? "bg-win text-white"
                  : f === "L"
                  ? "bg-loss text-white"
                  : "bg-primary text-black"
                : "bg-surface border border-border text-gray-400"
            }`}
          >
            {f === "all" ? "Todas" : f === "W" ? "✓ Vitórias" : "✗ Derrotas"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600 self-center">
          {filtered.length} {filtered.length === 1 ? "jogo" : "jogos"}
        </span>
      </div>

      {/* Match cards */}
      {filtered.map((m) => (
        <Card
          key={m.id}
          className="border-l-4"
          style={{ borderLeftColor: m.result === "W" ? "#4CAF50" : "#F44336" }}
        >
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  m.result === "W"
                    ? "bg-win/20 text-win"
                    : "bg-loss/20 text-loss"
                }`}
              >
                {m.result}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold leading-none">
                    {m.goals_for}–{m.goals_against}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      m.result === "W" ? "text-win" : "text-loss"
                    }`}
                  >
                    {m.result === "W" ? "Vitória" : "Derrota"}
                  </span>
                </div>
                {m.notes && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {m.notes}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1.5">
                  {format(new Date(m.created_at), "dd 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                disabled={deleting === m.id}
                className="p-2 text-gray-700 hover:text-loss transition-colors disabled:opacity-40"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

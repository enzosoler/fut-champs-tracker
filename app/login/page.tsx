"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-block bg-surface border border-border rounded-2xl p-4 mb-4">
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            FUT CHAMPS <span className="text-primary">TRACKER</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">FC 26 · Temporada 2025/26</p>
        </div>

        {sent ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <h2 className="font-semibold text-lg mb-2">Verifique seu e-mail</h2>
            <p className="text-gray-400 text-sm">
              Enviamos um link mágico para <strong className="text-white">{email}</strong>.
              Clique no link para entrar — sem senha!
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-primary text-sm underline"
            >
              Tentar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Seu e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <p className="text-loss text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Entrar com Magic Link"}
            </button>

            <p className="text-center text-xs text-gray-600">
              Sem senha. Um link de acesso será enviado para o seu e-mail.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

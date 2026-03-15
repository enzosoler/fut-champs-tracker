"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Loader2 } from "lucide-react";

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
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* ── Field line background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.06]">
          <defs>
            <pattern id="field" x="0" y="0" width="320" height="480" patternUnits="userSpaceOnUse">
              {/* Outer border */}
              <rect x="20" y="30" width="280" height="420" fill="none" stroke="white" strokeWidth="1.5"/>
              {/* Center line */}
              <line x1="20" y1="240" x2="300" y2="240" stroke="white" strokeWidth="1.5"/>
              {/* Center circle */}
              <circle cx="160" cy="240" r="50" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="160" cy="240" r="2" fill="white"/>
              {/* Penalty boxes */}
              <rect x="85" y="30" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="115" y="30" width="90" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="85" y="385" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="115" y="425" width="90" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
              {/* Penalty arcs */}
              <path d="M 120 95 A 35 35 0 0 1 200 95" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M 120 385 A 35 35 0 0 0 200 385" fill="none" stroke="white" strokeWidth="1.5"/>
              {/* Corner arcs */}
              <path d="M 20 42 A 12 12 0 0 1 32 30" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M 288 30 A 12 12 0 0 1 300 42" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M 20 438 A 12 12 0 0 0 32 450" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M 288 450 A 12 12 0 0 0 300 438" fill="none" stroke="white" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#field)"/>
        </svg>
      </div>

      {/* ── Glow effects ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FFB800]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Card ── */}
      <div className="relative w-full max-w-sm z-10">

        {/* Badge */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-[#FFB800]/20 blur-xl scale-150" />
            {/* Shield shape */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 100 110" className="absolute inset-0 w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD060"/>
                    <stop offset="50%" stopColor="#FFB800"/>
                    <stop offset="100%" stopColor="#CC8800"/>
                  </linearGradient>
                  <linearGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a1a1a"/>
                    <stop offset="100%" stopColor="#0d0d0d"/>
                  </linearGradient>
                </defs>
                {/* Shield border */}
                <path d="M50 4 L92 20 L92 58 Q92 88 50 106 Q8 88 8 58 L8 20 Z"
                  fill="url(#shieldGrad)" />
                {/* Shield inner */}
                <path d="M50 12 L85 26 L85 57 Q85 82 50 98 Q15 82 15 57 L15 26 Z"
                  fill="url(#shieldInner)" />
                {/* FCT text */}
                <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="800"
                  fill="#FFB800" fontFamily="system-ui, sans-serif" letterSpacing="2">FCT</text>
                {/* Ball icon */}
                <circle cx="50" cy="36" r="10" fill="none" stroke="#FFB800" strokeWidth="1.5"/>
                <line x1="50" y1="26" x2="50" y2="46" stroke="#FFB800" strokeWidth="1" opacity="0.6"/>
                <line x1="40" y1="36" x2="60" y2="36" stroke="#FFB800" strokeWidth="1" opacity="0.6"/>
                <ellipse cx="50" cy="36" rx="6" ry="10" fill="none" stroke="#FFB800" strokeWidth="1" opacity="0.4"/>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-widest text-white uppercase">
            FUT CHAMPS
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-8 bg-[#FFB800]/40" />
            <span className="text-[#FFB800] text-xs font-bold tracking-[0.25em] uppercase">Tracker</span>
            <div className="h-px w-8 bg-[#FFB800]/40" />
          </div>
          <p className="text-gray-600 text-xs mt-2">FC 26 · Temporada 2025/26</p>
        </div>

        {/* Form card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center mx-auto">
                <Mail size={24} className="text-[#FFB800]" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Verifique seu e-mail</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Enviamos um link de acesso para{" "}
                  <span className="text-white font-semibold">{email}</span>.
                  <br />Clique no link para entrar.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-[#FFB800]/60 text-sm hover:text-[#FFB800] transition"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="digite seu e-mail..."
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#FFB800]/50 focus:bg-black/60 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-[#FFB800] hover:bg-[#FFC933] active:scale-[0.98] disabled:opacity-50 text-black font-black py-3.5 rounded-xl transition-all text-sm tracking-wide shadow-lg shadow-[#FFB800]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Entrar com Magic Link ✨"
                )}
              </button>

              <p className="text-center text-xs text-gray-700">
                Um link de acesso seguro será enviado ao seu e-mail.
                <br />Não é necessário senha.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center z-10">
        <p className="text-xs text-gray-800">
          Desenvolvido por <span className="text-gray-600 font-semibold">SolerWorks</span>
        </p>
      </div>
    </div>
  );
}

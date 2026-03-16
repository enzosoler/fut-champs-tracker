"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";

/* ── SVG icons for OAuth providers ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.8 7.2v6h7.7c4.5-4.1 7.5-10.2 7.5-17.5z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.6v6.2C6.5 42.8 14.7 48 24 48z"/>
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 10.5 19.4v-6.2H2.6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z"/>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.5 30.4 0 24 0 14.7 0 6.5 5.2 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 495.2 0 367.3 0 245.8 0 107.4 91.2 34 180.5 34c76 0 127.4 50.5 168.3 50.5 39.3 0 101-53.4 186.5-53.4 29.5 0 108.2 2.6 168.3 80zm-108.5-185.2c35.5-42.1 61-100.6 61-159.1 0-8.3-.6-16.7-2-24.4-57.2 2.2-125.1 38.2-166.6 86.2-32.1 36.8-62 95.2-62 154.4 0 9 1.3 18 2 20.9 3.6.6 9.4 1.3 15.2 1.3 51.5 0 115.4-34.5 152.4-79.3z"/>
    </svg>
  );
}

type Mode = "password" | "magic";
type Step = "credentials" | "mfa" | "magic-sent";

export default function LoginPage() {
  const router = useRouter();

  const [mode,     setMode]     = useState<Mode>("password");
  const [step,     setStep]     = useState<Step>("credentials");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [mfaCode,  setMfaCode]  = useState("");
  const [factorId, setFactorId] = useState("");
  const [chalId,   setChalId]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error,        setError]        = useState("");

  /* ── Password login ── */
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError(signInErr.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : signInErr.message);
      setLoading(false);
      return;
    }

    // Check if MFA is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      // Get TOTP factor
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        // Create challenge
        const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
        if (chalErr) { setError(chalErr.message); setLoading(false); return; }
        setFactorId(totp.id);
        setChalId(chal!.id);
        setStep("mfa");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace("/dashboard");
  }

  /* ── MFA verify ── */
  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: chalId,
      code: mfaCode.replace(/\s/g, ""),
    });
    if (error) {
      setError("Código inválido. Tente novamente.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  /* ── OAuth (Google / Apple) ── */
  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  /* ── Magic link ── */
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("magic-sent");
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Field background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.04]">
          <defs>
            <pattern id="field" x="0" y="0" width="320" height="480" patternUnits="userSpaceOnUse">
              <rect x="20" y="30" width="280" height="420" fill="none" stroke="white" strokeWidth="1.5"/>
              <line x1="20" y1="240" x2="300" y2="240" stroke="white" strokeWidth="1.5"/>
              <circle cx="160" cy="240" r="50" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="85" y="30" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="85" y="385" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#field)"/>
        </svg>
      </div>

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-black tracking-widest text-white uppercase">
            FUT CHAMPS
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-primary text-xs font-bold tracking-[0.25em] uppercase">Tracker</span>
            <div className="h-px w-8 bg-primary/40" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#141A25]/80 backdrop-blur-sm border border-[#273246] rounded-2xl p-6 shadow-2xl space-y-5">

          {/* ── MFA step ── */}
          {step === "mfa" && (
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <div className="w-12 h-12 rounded-full bg-chart-4/10 border border-chart-4/30 flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={22} className="text-chart-4" />
                </div>
                <h2 className="font-heading font-bold text-lg">Verificação 2FA</h2>
                <p className="text-xs text-[#94A3B8]">Digite o código do seu app autenticador</p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000 000"
                  autoFocus
                  className="w-full bg-background border border-[#273246] rounded-xl px-4 py-3.5 text-white text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]/30 placeholder:text-base placeholder:tracking-normal"
                />
              </div>

              {error && <p className="text-loss text-xs bg-loss/10 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Verificar"}
              </button>

              <button type="button" onClick={() => { setStep("credentials"); setMfaCode(""); setError(""); }}
                className="w-full text-xs text-[#94A3B8] hover:text-white transition">
                ← Voltar
              </button>
            </form>
          )}

          {/* ── Magic sent step ── */}
          {step === "magic-sent" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <Mail size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-white">Verifique seu e-mail</h2>
                <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed">
                  Enviamos um link para{" "}
                  <span className="text-white font-semibold">{email}</span>.
                </p>
              </div>
              <button onClick={() => { setStep("credentials"); setEmail(""); setError(""); }}
                className="text-primary/60 text-sm hover:text-primary transition">
                Usar outro e-mail
              </button>
            </div>
          )}

          {/* ── Credentials step ── */}
          {step === "credentials" && (
            <>
              {/* Mode toggle */}
              <div className="flex bg-background rounded-xl p-1 gap-1">
                {(["password", "magic"] as Mode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      mode === m
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    {m === "password" ? "🔐 Senha" : "✨ Magic Link"}
                  </button>
                ))}
              </div>

              {/* Password form */}
              {mode === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-mail"
                        required
                        className="w-full bg-background border border-[#273246] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                      />
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Senha"
                        required
                        autoComplete="current-password"
                        className="w-full bg-background border border-[#273246] rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-loss text-xs bg-loss/10 rounded-lg px-3 py-2">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition shadow-lg shadow-primary/20 text-sm"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Entrar"}
                  </button>

                  <p className="text-center text-[10px] text-[#94A3B8]/50 leading-relaxed">
                    Não tem conta? Use Magic Link ou peça ao admin.
                  </p>
                </form>
              )}

              {/* Magic link form */}
              {mode === "magic" && (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="E-mail"
                      required
                      className="w-full bg-background border border-[#273246] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                    />
                  </div>

                  {error && <p className="text-loss text-xs bg-loss/10 rounded-lg px-3 py-2">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition shadow-lg shadow-primary/20 text-sm"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Enviar Magic Link ✨"}
                  </button>
                </form>
              )}

              {/* ── OAuth divider + buttons ── */}
              <div className="relative flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-[#273246]" />
                <span className="text-[10px] text-[#94A3B8]/50 font-medium uppercase tracking-widest whitespace-nowrap">
                  ou continue com
                </span>
                <div className="flex-1 h-px bg-[#273246]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={!!oauthLoading}
                  className="flex items-center justify-center gap-2 bg-background border border-[#273246] hover:border-[#94A3B8]/40 hover:bg-[#1E293B] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition"
                >
                  {oauthLoading === "google"
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><GoogleIcon /><span>Google</span></>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={!!oauthLoading}
                  className="flex items-center justify-center gap-2 bg-background border border-[#273246] hover:border-[#94A3B8]/40 hover:bg-[#1E293B] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition"
                >
                  {oauthLoading === "apple"
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><AppleIcon /><span>Apple</span></>
                  }
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#94A3B8]/30 mt-6">
          Desenvolvido por <span className="text-[#94A3B8]/50 font-semibold">SolerWorks</span>
        </p>
      </div>
    </div>
  );
}

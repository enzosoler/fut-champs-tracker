'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AtSign, Loader2, ShieldCheck } from 'lucide-react';

export default function SetupUsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existing) {
      setError('Este username já está em uso.');
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from('profiles').insert({
      id:         user.id,
      username:   username.toLowerCase(),
      full_name:  user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });

    if (insertErr) {
      setError(insertErr.message.includes('unique') ? 'Este username já está em uso.' : insertErr.message);
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-black tracking-widest text-white uppercase">Escolha seu</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-primary text-xs font-bold tracking-[0.25em] uppercase">Username</span>
            <div className="h-px w-8 bg-primary/40" />
          </div>
          <p className="text-[#94A3B8] text-sm mt-3 text-center leading-relaxed">
            Seu identificador único no app.<br/>3–20 caracteres, letras, números e _.
          </p>
        </div>

        <div className="bg-[#141A25]/80 backdrop-blur-sm border border-[#273246] rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="seu_username"
                maxLength={20}
                autoFocus
                className="w-full bg-background border border-[#273246] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition font-mono"
              />
            </div>

            {username.length > 0 && (
              <p className={`text-xs px-1 ${isValid ? 'text-win' : 'text-[#94A3B8]'}`}>
                {isValid ? '✓ Username válido' : username.length < 3 ? 'Mínimo 3 caracteres' : 'Apenas letras, números e _'}
              </p>
            )}

            {error && <p className="text-loss text-xs bg-loss/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition shadow-lg shadow-primary/20 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmar username'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

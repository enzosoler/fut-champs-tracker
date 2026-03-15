'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { LANGUAGES } from '@/lib/i18n';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const displayName = user?.email?.split('@')[0] ?? '';

  return (
    <header className="sticky top-0 z-10 bg-[#121212] border-b border-[#333333] px-4 py-2.5 flex items-center justify-between">
      <h1 className="text-base font-bold tracking-tight">
        FUT <span className="text-white">TRACKER</span>
      </h1>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-0.5">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={l.label}
              className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                lang === l.code
                  ? 'bg-[#FFB800]/20 text-[#FFB800]'
                  : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User size={11} />
              <span className="max-w-[80px] truncate">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors px-1.5 py-1 rounded-lg hover:bg-[#FFB800]/5"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-500 font-medium">FC 26</span>
        )}
      </div>
    </header>
  );
}

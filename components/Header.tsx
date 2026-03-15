'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { LANGUAGES } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-[#273246]">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
          FC 26 Tracker
        </span>

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
                    ? 'bg-primary/20 text-primary'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {l.flag}
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-loss transition-colors px-1.5 py-1 rounded-lg"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

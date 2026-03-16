'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login'];
const SETUP_PATH  = '/setup-username';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        if (!PUBLIC_PATHS.includes(pathname)) router.replace('/login');
        return;
      }

      // If logged in on login page → check profile then redirect
      if (pathname === '/login') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        setLoading(false);
        router.replace(profile ? '/dashboard' : SETUP_PATH);
        return;
      }

      // If on setup page, allow through
      if (pathname === SETUP_PATH) {
        setLoading(false);
        return;
      }

      // Check profile exists for all other authenticated pages
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      setLoading(false);
      if (!profile) {
        router.replace(SETUP_PATH);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !PUBLIC_PATHS.includes(pathname)) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}

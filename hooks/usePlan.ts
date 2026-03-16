'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Plan = 'free' | 'premium';

export function usePlan() {
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (data?.plan) setPlan(data.plan as Plan);
      setLoading(false);
    }
    fetchPlan();
  }, []);

  return { plan, isPremium: plan === 'premium', loading };
}

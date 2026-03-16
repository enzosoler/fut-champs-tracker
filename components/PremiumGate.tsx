'use client';

import { Crown, Lock, Zap } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { useRouter } from 'next/navigation';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  /** If true, shows a blurred overlay instead of replacing content */
  overlay?: boolean;
}

export default function PremiumGate({ children, feature, overlay = false }: PremiumGateProps) {
  const { isPremium, loading } = usePlan();
  const router = useRouter();

  if (loading) return <>{children}</>;
  if (isPremium) return <>{children}</>;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl">
          <UpgradeCard feature={feature} onClick={() => router.push('/profile')} />
        </div>
      </div>
    );
  }

  return <UpgradeCard feature={feature} onClick={() => router.push('/profile')} />;
}

function UpgradeCard({ feature, onClick }: { feature?: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
        <Crown size={24} className="text-amber-400" />
      </div>
      <div>
        <p className="font-heading font-bold text-white text-base">Premium Feature</p>
        {feature && (
          <p className="text-sm text-[#94A3B8] mt-0.5">{feature} requires a Premium plan</p>
        )}
      </div>
      <button
        onClick={onClick}
        className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-amber-500/20"
      >
        <Zap size={14} />
        Upgrade to Premium
      </button>
    </div>
  );
}

/** Inline badge shown next to premium-only items in navigation/menus */
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-bold text-amber-400 uppercase tracking-wide">
      <Crown size={8} />
      PRO
    </span>
  );
}

/** Lock icon shown on locked features */
export function PremiumLock({ size = 12 }: { size?: number }) {
  return <Lock size={size} className="text-amber-400/70" />;
}

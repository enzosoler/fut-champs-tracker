"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, History, BarChart2, Users, Trophy, Lightbulb, Target, Crown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t, ACTIVE_WL_KEY } from "@/lib/i18n";
import { usePlan } from "@/hooks/usePlan";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { isPremium } = usePlan();
  const [hasActiveWL, setHasActiveWL] = useState(false);

  useEffect(() => {
    try {
      setHasActiveWL(!!localStorage.getItem(ACTIVE_WL_KEY));
    } catch {}
  }, []);

  // Core 6 nav items — Insights & Goals replace Players in bottom nav
  // Players/Opponents/Packs still accessible via History page
  const navItems = [
    { label: 'Home',     icon: LayoutDashboard, href: "/dashboard",      premium: false },
    { label: 'WL',       icon: Trophy,          href: "/weekend-league", premium: false },
    { label: 'Log',      icon: PlusCircle,      href: "/add-match",      premium: false },
    { label: 'History',  icon: History,         href: "/history",        premium: false },
    { label: 'Insights', icon: Lightbulb,       href: "/insights",       premium: false },
    { label: 'Goals',    icon: Target,          href: "/goals",          premium: false },
    { label: 'Analytics',icon: BarChart2,       href: "/analytics",      premium: true  },
  ];

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-[#273246] z-20">
      <div className="flex max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isWL     = item.href === "/weekend-league";
          const isLog    = item.href === "/add-match";
          const showLock = item.premium && !isPremium;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {/* Log button gets special treatment */}
              {isLog ? (
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg ${isActive ? 'bg-primary' : 'bg-primary/80 hover:bg-primary'}`}>
                  <item.icon size={18} strokeWidth={2.5} className="text-white" />
                </div>
              ) : (
                <div className="relative">
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  {showLock && (
                    <Crown size={7} className="absolute -top-1 -right-1 text-amber-400" />
                  )}
                </div>
              )}
              <span className={isLog ? 'text-primary font-bold' : ''}>{item.label}</span>
              {/* Active WL indicator dot */}
              {isWL && hasActiveWL && !isActive && (
                <span className="absolute top-1.5 right-[calc(50%-12px)] w-1.5 h-1.5 bg-win rounded-full" />
              )}
              {/* Active indicator bar */}
              {isActive && !isLog && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, History, BarChart2, Users, Trophy, UserSearch, Crown } from "lucide-react";
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

  const navItems = [
    { labelKey: 'nav_dashboard'  as const, icon: LayoutDashboard, href: "/dashboard",      premium: false },
    { labelKey: 'nav_wl'         as const, icon: Trophy,           href: "/weekend-league", premium: false },
    { labelKey: 'nav_register'   as const, icon: PlusCircle,       href: "/add-match",      premium: false },
    { labelKey: 'nav_history'    as const, icon: History,          href: "/history",        premium: false },
    { labelKey: 'nav_squad'      as const, icon: Users,            href: "/squad",          premium: false },
    { labelKey: 'nav_analytics'  as const, icon: BarChart2,        href: "/analytics",      premium: true  },
    { labelKey: 'nav_players'    as const, icon: UserSearch,       href: "/players",        premium: false },
  ];

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-[#273246] z-20">
      <div className="flex max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isWL     = item.href === "/weekend-league";
          const showLock = item.premium && !isPremium;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <div className="relative">
                <item.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                {showLock && (
                  <Crown size={8} className="absolute -top-1 -right-1.5 text-amber-400" />
                )}
              </div>
              {t(item.labelKey, lang)}
              {/* Active WL indicator dot */}
              {isWL && hasActiveWL && !isActive && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 bg-win rounded-full" />
              )}
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

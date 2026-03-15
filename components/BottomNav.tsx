"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, History, BarChart2, Swords, Trophy } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t, ACTIVE_WL_KEY } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [hasActiveWL, setHasActiveWL] = useState(false);

  useEffect(() => {
    try {
      setHasActiveWL(!!localStorage.getItem(ACTIVE_WL_KEY));
    } catch {}
  }, []);

  const navItems = [
    { labelKey: 'nav_dashboard'  as const, icon: LayoutDashboard, href: "/dashboard"       },
    { labelKey: 'nav_wl'         as const, icon: Trophy,           href: "/weekend-league"  },
    { labelKey: 'nav_register'   as const, icon: PlusCircle,       href: "/add-match"       },
    { labelKey: 'nav_history'    as const, icon: History,          href: "/history"         },
    { labelKey: 'nav_opponents'  as const, icon: Swords,           href: "/opponents"       },
    { labelKey: 'nav_analytics'  as const, icon: BarChart2,        href: "/analytics"       },
  ];

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur border-t border-white/10 z-20">
      <div className="flex max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isWL     = item.href === "/weekend-league";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#FFB800]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
              {t(item.labelKey, lang)}
              {/* Active WL indicator dot */}
              {isWL && hasActiveWL && !isActive && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 bg-green-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

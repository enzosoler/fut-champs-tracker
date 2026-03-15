"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, History, BarChart2, Swords } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const navItems = [
    { labelKey: 'nav_dashboard' as const, icon: LayoutDashboard, href: "/dashboard"  },
    { labelKey: 'nav_register'  as const, icon: PlusCircle,      href: "/add-match"  },
    { labelKey: 'nav_history'   as const, icon: History,         href: "/history"    },
    { labelKey: 'nav_opponents' as const, icon: Swords,          href: "/opponents"  },
    { labelKey: 'nav_analytics' as const, icon: BarChart2,       href: "/analytics"  },
  ];

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/10 z-20">
      <div className="flex max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#FFB800]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {t(item.labelKey, lang)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, History, Users, BarChart2, Swords, Package } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard"  },
  { label: "Registrar", icon: PlusCircle,      href: "/add-match"  },
  { label: "Histórico", icon: History,         href: "/history"    },
  { label: "Oponentes", icon: Swords,          href: "/opponents"  },
  { label: "Análises",  icon: BarChart2,       href: "/analytics"  },
];

// Extra pages accessible via nav but not in main bar:
// /squad  /packs

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/10 z-20">
      <div className="flex max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#FFB800]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

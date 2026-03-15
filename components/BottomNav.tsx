"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, History } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Registrar", icon: PlusCircle, href: "/add-match" },
  { label: "Histórico", icon: History, href: "/history" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-20">
      <div className="flex max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon
                size={22}
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

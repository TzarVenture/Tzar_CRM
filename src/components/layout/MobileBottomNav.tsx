"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  MessageCircle,
  Building2,
  Menu,
} from "lucide-react";
import { useMobileNav } from "./MobileNavContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openMobileMenu } = useMobileNav();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
    { label: "Messages", href: "/messages", icon: MessageCircle, badge: true },
    { label: "Clients", href: "/clients", icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-3 py-1.5 flex items-center justify-around safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] ${
              active
                ? "text-slate-900 font-extrabold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110 text-slate-900" : "text-slate-500"}`} />
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            {active && (
              <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
            )}
          </Link>
        );
      })}

      {/* "More / Menu" Drawer Button */}
      <button
        onClick={openMobileMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all cursor-pointer min-w-[56px]"
      >
        <Menu className="w-5 h-5 text-slate-500" />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </div>
  );
}

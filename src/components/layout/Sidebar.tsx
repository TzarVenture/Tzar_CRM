"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  MessageCircle,
  BarChart3,
  FolderOpen,
  Settings,
  LogOut,
  Building2,
  Zap,
} from "lucide-react";

import { useSession } from "next-auth/react";
import { UserRole } from "@/models/User";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Clients", href: "/clients", icon: Building2 },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  {
    label: "Meta Ads",
    href: "/meta-ads",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "SALES_MANAGER"],
  },
  { label: "Files", href: "/files", icon: FolderOpen },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    roles: ["SUPER_ADMIN"], // Strictly Owner Only!
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "SALES_MANAGER"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role || "BDE") as UserRole;

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col bg-(--color-bg-surface) border-r border-(--color-border-light) z-40"
      style={{ boxShadow: "var(--shadow-sidebar)", width: "var(--sidebar-width)" }}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-border-light)">
        <div className="flex items-center justify-center shrink-0">
          <Image
            src="/TzarLogo-09.png"
            alt="TZAR Logo"
            width={38}
            height={38}
            className="w-9 h-9 object-contain"
            priority
          />
        </div>
        <div>
          <p
            className="text-lg font-extrabold tracking-tight text-(--color-text-primary) leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TZAR CRM
          </p>
          <p className="text-[10px] font-bold text-(--color-text-muted) tracking-wider uppercase leading-none mt-1">
            Enterprise Suite
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 group",
                active
                  ? "text-white shadow-xs"
                  : "text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
              )}
              style={
                active
                  ? { backgroundColor: "var(--color-brand-green)" }
                  : undefined
              }
            >
              <Icon
                className={clsx(
                  "w-5 h-5 shrink-0 transition-colors",
                  active
                    ? "text-white"
                    : "text-(--color-text-muted) group-hover:text-(--color-brand-green)"
                )}
              />
              <span className="truncate">{item.label}</span>

              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-white shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="px-3.5 py-4 border-t border-(--color-border-light)">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold text-(--color-text-secondary) hover:bg-(--color-status-danger-bg) hover:text-(--color-status-danger) transition-all duration-150 group cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0 text-(--color-text-muted) group-hover:text-(--color-status-danger) transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

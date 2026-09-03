"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  KanbanSquare,
  Users,
  MessageCircle,
  BarChart3,
  FolderOpen,
  Settings,
  LogOut,
  Building2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/models/User";
import { useMobileNav } from "./MobileNavContext";

interface NavGroup {
  heading: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    roles?: UserRole[];
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "MAIN MENU",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
    ],
  },
  {
    heading: "CUSTOMERS & COMMS",
    items: [
      { label: "Clients", href: "/clients", icon: Building2 },
      { label: "Messages", href: "/messages", icon: MessageCircle, badge: "Live" },
      {
        label: "Meta Ads",
        href: "/meta-ads",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "SALES_MANAGER"],
      },
      { label: "Files & Assets", href: "/files", icon: FolderOpen },
    ],
  },
  {
    heading: "MANAGEMENT",
    items: [
      {
        label: "Team Members",
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
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileMenuOpen, closeMobileMenu } = useMobileNav();
  const userRole = (session?.user?.role || "BDE") as UserRole;

  useEffect(() => {
    // Only apply desktop sidebar offset on md+ screens
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.documentElement.style.setProperty(
          "--sidebar-width",
          isCollapsed ? "68px" : "240px"
        );
      } else {
        document.documentElement.style.setProperty("--sidebar-width", "0px");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItems = (isMobile = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {NAV_GROUPS.map((group) => {
        const filteredItems = group.items.filter(
          (item) => !item.roles || item.roles.includes(userRole)
        );

        if (filteredItems.length === 0) return null;

        return (
          <div key={group.heading} className="space-y-1">
            {(!isCollapsed || isMobile) && (
              <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                {group.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => {
                      if (isMobile) closeMobileMenu();
                    }}
                    title={isCollapsed && !isMobile ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                      }`}
                    />

                    {(!isCollapsed || isMobile) && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}

                    {(!isCollapsed || isMobile) && item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ─── 1. DESKTOP SIDEBAR (Visible on md+ screens) ────────────────── */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-screen flex-col bg-white border-r border-slate-200/90 z-40 transition-all duration-300 ${
          isCollapsed ? "w-[68px]" : "w-[240px]"
        }`}
        style={{ boxShadow: "0 1px 3px 0 rgb(15 23 42 / 0.04)" }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Link href="/" prefetch={true} className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm">
              TZ
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  TZAR CRM
                </p>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none mt-1">
                  Enterprise Suite
                </p>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Links */}
        {renderNavItems(false)}

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 p-1.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {session?.user?.name || "Team Member"}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">
                    {userRole}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── 2. MOBILE SLIDE-OVER DRAWER (Visible on < md screens when open) ─ */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop Overlay */}
          <div
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Slide-in Sheet Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl border-r border-slate-200 z-50 animate-slide-up">
            {/* Mobile Header with Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm">
                  TZ
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-slate-900 leading-none">
                    TZAR CRM
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none mt-1">
                    Multi-Brand Suite
                  </p>
                </div>
              </div>

              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            {renderNavItems(true)}

            {/* User Footer Card */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session?.user?.name || "Team Member"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 truncate">
                      {userRole}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  KanbanSquare,
  Users,
  MessageCircle,
  BarChart3,
  FolderOpen,
  Receipt,
  Wallet,
  Settings,
  LogOut,
  Building2,
  X,
} from "lucide-react";
import { UserRole } from "@/models/User";
import { useMobileNav } from "./MobileNavContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: UserRole[];
}

interface NavGroup {
  heading: string;
  items: NavItem[];
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
    heading: "ACCOUNTS",
    items: [
      { label: "Invoices", href: "/invoices", icon: Receipt, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Expenses", href: "/expenses", icon: Wallet, roles: ["SUPER_ADMIN", "ADMIN"] },
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

// ─── Collapsed state, remembered across visits ─────────────────────────────
// Kept in localStorage and read through useSyncExternalStore, so the server
// render (always expanded) and the browser agree without a flash or an effect.
const COLLAPSE_KEY = "tzar-sidebar-collapsed";
const COLLAPSE_EVENT = "tzar-sidebar-collapse-change";

function subscribeToCollapse(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  } catch {
    // Private mode or blocked storage: the choice just lasts for this page view
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileNav();
  const isCollapsed = useSyncExternalStore(subscribeToCollapse, readCollapsed, () => false);
  const userRole = (session?.user?.role || "BDE") as UserRole;

  // Page content is offset by --sidebar-width. A media-query listener updates it
  // only when the desktop breakpoint is crossed, not on every resize pixel.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const apply = () =>
      document.documentElement.style.setProperty(
        "--sidebar-width",
        desktop.matches ? (isCollapsed ? "68px" : "240px") : "0px"
      );
    apply();
    desktop.addEventListener("change", apply);
    return () => desktop.removeEventListener("change", apply);
  }, [isCollapsed]);

  // Esc closes the mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
      })).filter((group) => group.items.length > 0),
    [userRole]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItems = (isMobile = false) => {
    const compact = isCollapsed && !isMobile;

    return (
      <nav aria-label="Main" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.heading} className="space-y-1">
            {compact ? (
              // Icon-only mode keeps the grouping visible as a thin divider
              groupIndex > 0 && <div className="mx-2 mb-2 border-t border-slate-200" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-0.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={isMobile ? closeMobileMenu : undefined}
                      title={compact ? item.label : undefined}
                      aria-label={compact ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${focusRing} ${
                        compact ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                      } ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                        }`}
                      />

                      {!compact && <span className="flex-1 truncate">{item.label}</span>}

                      {!compact && item.badge && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  };

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <>
      {/* ─── 1. DESKTOP SIDEBAR (Visible on md+ screens) ────────────────── */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-screen flex-col bg-white border-r border-slate-200/90 z-40 transition-[width] duration-200 ease-out ${
          isCollapsed ? "w-[68px]" : "w-[240px]"
        }`}
        style={{ boxShadow: "0 1px 3px 0 rgb(15 23 42 / 0.04)" }}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-slate-100 py-4 ${
            isCollapsed ? "flex-col gap-3 px-2" : "justify-between px-4"
          }`}
        >
          <Link href="/" prefetch={true} className={`flex items-center gap-3 overflow-hidden rounded-xl ${focusRing}`}>
            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-base">
              TZ
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900 leading-none">TZAR CRM</p>
                <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase leading-none mt-1">
                  Enterprise Suite
                </p>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            onClick={() => writeCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer ${focusRing}`}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Links */}
        {renderNavItems(false)}

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center gap-2 p-1.5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-2xs"
                title={isCollapsed ? session?.user?.name || "Team Member" : undefined}
              >
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {session?.user?.name || "Team Member"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 truncate">{userRole}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${focusRing}`}
                title="Sign Out"
                aria-label="Sign Out"
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
                <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-base">
                  TZ
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight text-slate-900 leading-none">TZAR CRM</p>
                  <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase leading-none mt-1">
                    Multi-Brand Suite
                  </p>
                </div>
              </div>

              <button
                onClick={closeMobileMenu}
                className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${focusRing}`}
                title="Close Menu"
                aria-label="Close Menu"
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
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-base shrink-0 shadow-2xs">
                    {userInitial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {session?.user?.name || "Team Member"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 truncate">{userRole}</p>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className={`p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${focusRing}`}
                  title="Sign Out"
                  aria-label="Sign Out"
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

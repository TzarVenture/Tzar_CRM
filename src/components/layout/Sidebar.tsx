"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  Buildings,
  ChartPieSlice,
  ChartLineUp,
  Gear,
  Kanban,
  Receipt,
  CaretLeft,
  CaretRight,
  SignOut,
  Table,
  UsersThree,
  Wallet,
  X,
  BookOpenText,
  type Icon,
} from "@phosphor-icons/react";
import { UserRole } from "@/models/User";
import { can, type PermissionKey } from "@/lib/permissions";
import { useMobileNav } from "./MobileNavContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: Icon;
  /** Page permission needed to see this item */
  permission?: PermissionKey;
  /** Role-only areas (team, settings) */
  roles?: UserRole[];
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Accounts",
    items: [
      { label: "Overview", href: "/accounts", icon: ChartPieSlice, permission: "accounts.overview" },
      { label: "Invoices", href: "/invoices", icon: Receipt, permission: "accounts.invoices" },
      { label: "Customer Ledger", href: "/ledger", icon: BookOpenText, permission: "accounts.ledger" },
      { label: "Expenses", href: "/expenses", icon: Wallet, permission: "accounts.expenses" },
      { label: "GST Reports", href: "/gst-reports", icon: Table, permission: "accounts.gst" },
    ],
  },
  {
    heading: "Leads & Clients",
    items: [
      { label: "Lead Dashboard", href: "/lead-dashboard", icon: ChartLineUp, permission: "leads.dashboard" },
      { label: "Pipeline", href: "/pipeline", icon: Kanban, permission: "leads.pipeline" },
      { label: "Clients", href: "/clients", icon: Buildings, permission: "clients" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Team", href: "/team", icon: UsersThree, roles: ["SUPER_ADMIN"] },
      { label: "Settings", href: "/settings", icon: Gear, roles: ["SUPER_ADMIN"] },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  SALES_MANAGER: "Manager",
  BDE: "BDE",
  CLIENT: "Client",
};

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

const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 72;

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileNav();
  const isCollapsed = useSyncExternalStore(subscribeToCollapse, readCollapsed, () => false);
  const userRole = (session?.user?.role || "BDE") as UserRole;
  const permissions = session?.user?.permissions ?? [];

  // Page content is offset by --sidebar-width. A media-query listener updates it
  // only when the desktop breakpoint is crossed, not on every resize pixel.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const apply = () =>
      document.documentElement.style.setProperty(
        "--sidebar-width",
        desktop.matches ? `${isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px` : "0px"
      );
    apply();
    desktop.addEventListener("change", apply);
    return () => desktop.removeEventListener("change", apply);
  }, [isCollapsed]);

  // Ctrl/Cmd + B toggles the sidebar; Esc closes the mobile drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        writeCollapsed(!readCollapsed());
      }
      if (e.key === "Escape" && isMobileMenuOpen) closeMobileMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.roles) return item.roles.includes(userRole);
          if (item.permission) return can({ role: userRole, permissions }, item.permission);
          return true;
        }),
      })).filter((group) => group.items.length > 0),
    [userRole, permissions]
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItems = (isMobile = false) => {
    const compact = isCollapsed && !isMobile;

    return (
      <nav aria-label="Main" className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-4 ${compact ? "no-scrollbar px-3" : "px-3"}`}>
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.heading} className={groupIndex > 0 ? "mt-5" : ""}>
            {compact ? (
              groupIndex > 0 && <div className="mx-3 mb-3 border-t border-border" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground">{group.heading}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    {(() => {
                      const link = (
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={isMobile ? closeMobileMenu : undefined}
                          aria-label={compact ? item.label : undefined}
                          aria-current={active ? "page" : undefined}
                          className={`relative flex items-center gap-3 h-10 rounded-lg text-sm font-medium transition-colors duration-150 ${focusRing} ${
                            compact ? "justify-center" : "px-3"
                          } ${
                            active
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent" aria-hidden="true" />
                          )}
                          <Icon
                            size={20}
                            weight={active ? "fill" : "regular"}
                            className={`shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                          />
                          {!compact && <span className="flex-1 truncate">{item.label}</span>}
                        </Link>
                      );
                      return compact ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  };

  const userName = session?.user?.name || "Team member";
  const userInitial = userName[0]?.toUpperCase() || "U";

  const signOutButton = (compact: boolean) => {
    const button = (
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className={`p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors cursor-pointer ${focusRing}`}
        aria-label="Sign out"
      >
        <SignOut size={18} />
      </button>
    );
    return compact ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">Sign out</TooltipContent>
      </Tooltip>
    ) : (
      button
    );
  };

  const userBlock = (compact: boolean) =>
    compact ? (
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
              {userInitial}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {userName} · {ROLE_LABEL[userRole] || userRole}
          </TooltipContent>
        </Tooltip>
        {signOutButton(true)}
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
          {userInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{ROLE_LABEL[userRole] || userRole}</p>
        </div>
        {signOutButton(false)}
      </div>
    );

  const brand = (compact: boolean) => (
    <Link href="/accounts" prefetch={true} className={`flex items-center gap-3 min-w-0 rounded-lg ${focusRing}`} aria-label="Tzar CRM home">
      <Image src="/TzarLogo-09.png" alt="Tzar" width={36} height={40} priority className="h-10 w-auto shrink-0" />
      {!compact && (
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight text-foreground leading-tight">Tzar CRM</p>
          <p className="text-xs text-muted-foreground leading-tight">Digital Agency</p>
        </div>
      )}
    </Link>
  );

  return (
    <>
      {/* ─── Desktop sidebar ────────────────────────────────────────────── */}
      <TooltipProvider delayDuration={150}>
        <aside
          className="hidden md:flex fixed top-0 left-0 h-screen flex-col bg-card border-r border-border z-40 transition-[width] duration-200 ease-out"
          style={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        >
          {/* Edge toggle: sits on the sidebar's right border so it is always in the same place */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => writeCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
                className={`absolute -right-3.5 top-[22px] z-50 grid size-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground cursor-pointer ${focusRing}`}
              >
                {isCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"} (Ctrl+B)</TooltipContent>
          </Tooltip>

          <div className={`flex items-center h-16 border-b border-border shrink-0 ${isCollapsed ? "justify-center" : "px-4"}`}>
            {brand(isCollapsed)}
          </div>

          {renderNavItems(false)}

          <div className="p-3 border-t border-border">{userBlock(isCollapsed)}</div>
        </aside>
      </TooltipProvider>

      {/* ─── Mobile drawer ──────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div onClick={closeMobileMenu} className="fixed inset-0 bg-foreground/50 backdrop-blur-xs cursor-pointer" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative w-72 max-w-[85vw] bg-card h-full flex flex-col shadow-2xl z-50 animate-slide-up"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
              {brand(false)}
              <button
                onClick={closeMobileMenu}
                className={`p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ${focusRing}`}
                title="Close menu"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {renderNavItems(true)}
            <div className="p-4 border-t border-border">
              <TooltipProvider>{userBlock(false)}</TooltipProvider>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

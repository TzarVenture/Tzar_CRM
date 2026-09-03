"use client";

import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Bell,
  ChevronDown,
  Shield,
  Zap,
  CheckCheck,
  UserCheck,
  Briefcase,
  BookOpen,
  Gift,
  ShoppingBag,
  Clock,
  X,
  Trash2,
  LogOut,
  User,
  Settings,
  Building2,
  ArrowRight,
  Sparkles,
  Download,
  Loader2,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useMobileNav } from "./MobileNavContext";

interface HeaderProps {
  title?: string;
}

interface NotificationItem {
  id: string;
  type: "NEW_LEAD" | "CONVERSION" | "BDE_NOTE" | "SLA_WARNING";
  title: string;
  message: string;
  timestamp: string;
  business?: "tzar" | "adshalaa" | "crownleaf" | "titepo";
  isUnread: boolean;
  leadCustomId?: string;
}

interface SearchResultItem {
  id: string;
  type: "LEAD" | "CLIENT";
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { openMobileMenu } = useMobileNav();

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dropdown States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Derive dynamic breadcrumbs from current route
  const getBreadcrumbs = () => {
    if (pathname === "/") return { root: "Dashboard", sub: "Overview" };
    if (pathname.startsWith("/pipeline")) return { root: "Pipeline", sub: "Leads" };
    if (pathname.startsWith("/clients")) return { root: "Clients", sub: "Accounts" };
    if (pathname.startsWith("/messages")) return { root: "Messages", sub: "WhatsApp Omnichannel" };
    if (pathname.startsWith("/meta-ads")) return { root: "Meta Ads", sub: "Campaigns" };
    if (pathname.startsWith("/files")) return { root: "Files", sub: "Document Assets" };
    if (pathname.startsWith("/team")) return { root: "Team", sub: "Organization" };
    if (pathname.startsWith("/settings")) return { root: "Settings", sub: "System Configuration" };
    return { root: "Dashboard", sub: "Overview" };
  };

  const breadcrumbs = getBreadcrumbs();

  // Global Keyboard Shortcuts (Ctrl+K for Search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/v1/leads?limit=6&sortBy=createdAt&sortOrder=desc");
        const leads = res.data?.leads || [];

        const notifList: NotificationItem[] = leads.map((l: any, idx: number) => ({
          id: l._id,
          type: l.status === "CONVERTED" ? "CONVERSION" : "NEW_LEAD",
          title: l.status === "CONVERTED" ? `Client Converted: ${l.fullName}` : `New Lead: ${l.fullName}`,
          message: l.interestedServices?.[0]
            ? `${l.interestedServices[0]} · ${l.business?.toUpperCase()}`
            : `Inbound inquiry for ${l.business?.toUpperCase()}`,
          timestamp: new Date(l.createdAt || Date.now()).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          business: l.business,
          isUnread: idx < 2,
          leadCustomId: l.leadCustomId,
        }));

        setNotifications(notifList);
      } catch {
        // Fallback gracefully
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search autocomplete query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/v1/leads?search=${encodeURIComponent(searchQuery)}&limit=8`);
        const leads = res.data?.leads || [];

        const results: SearchResultItem[] = leads.map((l: any) => ({
          id: l._id,
          type: "LEAD",
          title: l.fullName || "Inbound Contact",
          subtitle: `${l.phone || l.email || "No direct phone"} · ${l.business?.toUpperCase()}`,
          badge: l.leadCustomId || "LEAD",
          href: `/pipeline/${l._id}`,
        }));

        setSearchResults(results);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const dismissSingleNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {/* ─── FLOATING TOP CARD HEADER (EXACT BAGUI SCREENSHOT DESIGN) ──────── */}
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-slate-200/90 shadow-2xs transition-all duration-200"
        style={{
          left: "var(--sidebar-width)",
          height: "64px",
        }}
      >
        {/* Left Side: Mobile Hamburger + Current Title (Mobile) / Full Breadcrumbs (Desktop) */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={openMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>

          {/* Desktop Breadcrumb Navigation */}
          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Link href="/" className="text-blue-600 hover:underline font-bold transition-colors">
              {breadcrumbs.root}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-extrabold">{breadcrumbs.sub}</span>
          </div>

          {/* Mobile Clean Title */}
          <span className="md:hidden text-sm font-black text-slate-900 tracking-tight">
            {breadcrumbs.root}
          </span>
        </div>

        {/* Right Side: Search, Notifications, Profile (Responsive Spacing) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Search CRM (⌘K)"
          >
            <Search className="w-4 h-4 text-slate-700" />
          </button>

          {/* Desktop Integrated Search Input (BagUI Search Bar Style) */}
          <div className="hidden md:block relative w-64 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              onClick={() => setIsSearchOpen(true)}
              onFocus={() => setIsSearchOpen(true)}
              readOnly
              placeholder="Search..."
              className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-slate-900 outline-none text-slate-900 placeholder:text-slate-400 transition-all cursor-pointer"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 text-[10px] font-bold font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Dark Mode Toggle Icon (Desktop Only) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hidden md:inline-flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notification Bell with Active Red Dot */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Notifications ({notifications.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Read All
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium">
                      No active notifications.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors group ${
                          notif.isUnread ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <Link
                          href="/pipeline"
                          onClick={() => setIsNotifOpen(false)}
                          className="flex items-start gap-3 flex-1 min-w-0"
                        >
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                            {notif.type === "CONVERSION" ? (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            ) : notif.business === "adshalaa" ? (
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            ) : notif.business === "crownleaf" ? (
                              <Gift className="w-4 h-4 text-amber-600" />
                            ) : notif.business === "titepo" ? (
                              <ShoppingBag className="w-4 h-4 text-rose-600" />
                            ) : (
                              <Briefcase className="w-4 h-4 text-emerald-700" />
                            )}
                          </div>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {notif.title}
                              </p>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium truncate">
                              {notif.message}
                            </p>
                          </div>
                        </Link>

                        <button
                          onClick={(e) => dismissSingleNotification(e, notif.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
                  <Link
                    href="/pipeline"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All Leads in Smart Grid →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear Icon (Desktop Only) */}
          <Link
            href="/settings"
            className="hidden md:inline-flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* User Avatar Circle & Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer pl-1"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 ring-2 ring-slate-200">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "R"}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in p-2 space-y-1">
                <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-slate-900">
                    {session?.user?.name ?? "Rahul Rastogi"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">
                    {session?.user?.email ?? "rahul.47it@gmail.com"}
                  </p>
                  {session?.user?.role && (
                    <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase mt-1">
                      {session.user.role === "SUPER_ADMIN" ? "Super Admin" : session.user.role}
                    </span>
                  )}
                </div>

                <div className="pt-1 space-y-0.5 text-xs font-semibold text-slate-700">
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>System Settings & API Keys</span>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── GLOBAL COMMAND PALETTE SEARCH MODAL (Ctrl+K) ──────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 modal-overlay animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Top Search Input Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search leads, clients, contacts, custom IDs... (Press Esc to exit)"
                className="w-full text-sm font-semibold bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Stream */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {!searchQuery.trim() ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-emerald-600 mx-auto opacity-60" />
                  <p className="text-xs font-bold text-slate-700">Global Enterprise Search</p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Search across leads, client accounts, deals, phone numbers, and emails.
                  </p>
                </div>
              ) : isSearching ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Searching database...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-500">
                  No matching records found for "{searchQuery}".
                </div>
              ) : (
                searchResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        {item.type === "CLIENT" ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <Briefcase className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-right text-[11px] font-semibold text-slate-500">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

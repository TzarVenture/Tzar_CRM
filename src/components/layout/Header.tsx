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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global Import Modal State
  const [isGlobalImportOpen, setIsGlobalImportOpen] = useState(false);
  const [importBusiness, setImportBusiness] = useState<"tzar" | "adshalaa" | "crownleaf" | "titepo">("tzar");
  const [importFormId, setImportFormId] = useState("");
  const [importToken, setImportToken] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleGlobalCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawText = event.target?.result as string;
        const cleanedText = rawText.replace(/\0/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = cleanedText.split("\n").filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          setImportMsg("Error: CSV file appears to be empty.");
          setIsImporting(false);
          return;
        }

        const delimiter = lines[0].includes("\t") ? "\t" : ",";

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let k = 0; k < line.length; k++) {
            const char = line[k];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ""));
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ""));
          return result;
        };

        const headers = parseLine(lines[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || "";
          });
          records.push(record);
        }

        const res = await fetch("/api/v1/meta/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leads: records,
            business: importBusiness,
          }),
        }).then((r) => r.json());

        if (res.message) {
          setImportMsg(res.message);
          setTimeout(() => router.refresh(), 1000);
        } else {
          setImportMsg(`Error: ${res.error || "Failed to import CSV leads"}`);
        }
      } catch (err: any) {
        console.error("Global CSV Import error:", err);
        setImportMsg(`Error: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleGlobalGraphSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFormId.trim()) {
      setImportMsg("Error: Please enter a valid Meta Lead Form ID.");
      return;
    }

    setIsImporting(true);
    setImportMsg(null);

    try {
      const res = await fetch("/api/v1/meta/sync-historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: importFormId.trim(),
          business: importBusiness,
          pageAccessToken: importToken.trim() || undefined,
        }),
      }).then((r) => r.json());

      if (res.message) {
        setImportMsg(res.message);
        setTimeout(() => router.refresh(), 1000);
      } else {
        setImportMsg(`Error: ${res.error || "Failed to sync Meta leads"}`);
      }
    } catch (err: any) {
      console.error("Global Graph sync error:", err);
      setImportMsg(`Error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // ─── 1. GLOBAL KEYBOARD SHORTCUT (Ctrl+K / Cmd+K) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Execute Global Search Across Leads & Clients
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const q = searchQuery.toLowerCase();

        // Fetch Leads & Clients in parallel
        const [leadsRes, clientsRes] = await Promise.all([
          fetch(`/api/v1/leads`),
          fetch(`/api/v1/clients`),
        ]);

        const items: SearchResultItem[] = [];

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          if (data.leads && Array.isArray(data.leads)) {
            data.leads.forEach((l: any) => {
              const matchesName = (l.fullName || "").toLowerCase().includes(q);
              const matchesEmail = (l.email || "").toLowerCase().includes(q);
              const matchesPhone = (l.phone || "").toLowerCase().includes(q);
              const matchesId = (l.leadCustomId || "").toLowerCase().includes(q);

              if (matchesName || matchesEmail || matchesPhone || matchesId) {
                items.push({
                  id: l._id,
                  type: "LEAD",
                  title: l.fullName || "Lead",
                  subtitle: `${l.leadCustomId || "TZ-LD"} · ${l.email || l.phone || l.business || "Lead"}`,
                  badge: l.business ? l.business.toUpperCase() : "LEAD",
                  href: `/pipeline`,
                });
              }
            });
          }
        }

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          if (data.clients && Array.isArray(data.clients)) {
            data.clients.forEach((c: any) => {
              const matchesCompany = (c.companyName || "").toLowerCase().includes(q);
              const matchesContact = (c.primaryContact?.name || "").toLowerCase().includes(q);
              const matchesId = (c.clientCustomId || "").toLowerCase().includes(q);

              if (matchesCompany || matchesContact || matchesId) {
                items.push({
                  id: c._id,
                  type: "CLIENT",
                  title: c.companyName || "Client Account",
                  subtitle: `${c.clientCustomId || "TZ-CL"} · Contact: ${c.primaryContact?.name || "Client"}`,
                  badge: "CLIENT",
                  href: `/clients`,
                });
              }
            });
          }
        }

        setSearchResults(items.slice(0, 10));
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for Recent Ingested Leads & Activity Alerts (Optimized 12s Polling)
  useEffect(() => {
    const fetchLatestNotifications = async () => {
      try {
        const res = await fetch("/api/v1/leads");
        if (res.ok) {
          const data = await res.json();
          if (data.leads && Array.isArray(data.leads)) {
            const readIds: string[] = JSON.parse(
              localStorage.getItem("tzar_read_notifs") || "[]"
            );
            const dismissedIds: string[] = JSON.parse(
              localStorage.getItem("tzar_dismissed_notifs") || "[]"
            );

            const items: NotificationItem[] = data.leads
              .slice(0, 12)
              .filter((l: any) => !dismissedIds.includes(l._id.toString()))
              .map((l: any) => {
                const b = l.business || "tzar";
                const isConverted = l.status === "CONVERTED" || l.stageId === "closed-won";
                const isOverdue = l.slaDeadline && new Date(l.slaDeadline) < new Date();
                const isRead = readIds.includes(l._id.toString());

                return {
                  id: l._id.toString(),
                  type: isConverted ? "CONVERSION" : isOverdue ? "SLA_WARNING" : "NEW_LEAD",
                  title: isConverted
                    ? `⚙️ Lead Converted: ${l.fullName}`
                    : `🎯 Inbound Lead: ${l.fullName}`,
                  message: `[${b.toUpperCase()}] ID: ${l.leadCustomId || "TZ-LD"} via ${l.source || "Website"}`,
                  timestamp: new Date(l.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  business: b,
                  isUnread: !isRead,
                  leadCustomId: l.leadCustomId,
                };
              });

            setNotifications(items);
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchLatestNotifications();
    const interval = setInterval(fetchLatestNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const existingRead: string[] = JSON.parse(
      localStorage.getItem("tzar_read_notifs") || "[]"
    );
    const updated = Array.from(new Set([...existingRead, ...allIds]));
    localStorage.setItem("tzar_read_notifs", JSON.stringify(updated));

    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    const existingDismissed: string[] = JSON.parse(
      localStorage.getItem("tzar_dismissed_notifs") || "[]"
    );
    const updated = Array.from(new Set([...existingDismissed, ...allIds]));
    localStorage.setItem("tzar_dismissed_notifs", JSON.stringify(updated));

    setNotifications([]);
  };

  const dismissSingleNotification = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    const existingDismissed: string[] = JSON.parse(
      localStorage.getItem("tzar_dismissed_notifs") || "[]"
    );
    if (!existingDismissed.includes(notifId)) {
      existingDismissed.push(notifId);
      localStorage.setItem("tzar_dismissed_notifs", JSON.stringify(existingDismissed));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-(--color-brand-mustard-bg) text-(--color-brand-mustard) border-(--color-brand-mustard)/30",
      SALES_MANAGER: "bg-(--color-status-info-bg) text-(--color-status-info) border-(--color-status-info)/30",
      BDE: "bg-(--color-brand-green-light) text-(--color-brand-green) border-(--color-brand-green)/30",
    };
    return colors[role] ?? "bg-(--color-bg-subtle) text-(--color-text-secondary) border-(--color-border-light)";
  };

  const formatRole = (role: string) =>
    role
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 bg-(--color-bg-surface) border-b border-(--color-border-light)"
        style={{
          left: "var(--sidebar-width)",
          height: "var(--header-height)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          {title && (
            <h1 className="text-base sm:text-lg font-bold text-(--color-text-primary) truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Global Search Bar (Triggers Ctrl+K Command Palette Modal) */}
        <div className="flex-1 max-w-lg mx-3 sm:mx-8">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border transition-all duration-150 text-left cursor-pointer"
            style={{
              backgroundColor: "var(--color-bg-subtle)",
              borderColor: "var(--color-border-light)",
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 shrink-0 text-(--color-text-muted)" />
              <span className="text-xs sm:text-sm font-medium text-(--color-text-muted) truncate">
                Search leads, contacts, clients, deals...
              </span>
            </div>
            <kbd
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded text-(--color-text-muted) shrink-0"
              style={{ backgroundColor: "var(--color-bg-app)", border: "1px solid var(--color-border-light)" }}
            >
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Notifications & User Menu */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-(--color-border-light) hover:bg-(--color-bg-subtle) transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-(--color-text-secondary)" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse shadow-xs"
                  style={{ backgroundColor: "var(--color-brand-mustard)" }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Activity Alerts ({notifications.length})
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

                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Clear All Notifications"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Stream List */}
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
                              <ShoppingBag className="w-4 h-4 text-pink-600" />
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

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2.5 pl-3 py-1 border-l border-(--color-border-light) hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0 shadow-xs"
                style={{ backgroundColor: "var(--color-brand-green)" }}
              >
                {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>

              <div className="hidden lg:flex flex-col items-start text-left">
                <span className="text-xs sm:text-sm font-bold text-(--color-text-primary) leading-snug">
                  {session?.user?.name ?? "User"}
                </span>
                {session?.user?.role && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${getRoleBadgeColor(session.user.role)}`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {formatRole(session.user.role)}
                  </span>
                )}
              </div>

              <ChevronDown className="w-4 h-4 text-(--color-text-muted)" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in p-2 space-y-1">
                <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-slate-900">
                    {session?.user?.name ?? "User"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">
                    {session?.user?.email ?? "user@tzar.agency"}
                  </p>
                  {session?.user?.role && (
                    <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase mt-1">
                      {session.user.role}
                    </span>
                  )}
                </div>

                <div className="pt-1 space-y-0.5 text-xs font-semibold text-slate-700">
                  {session?.user?.role !== "BDE" && (
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>System Settings & API Keys</span>
                    </Link>
                  )}

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
                <div className="p-8 text-center text-xs font-semibold text-slate-500">
                  Searching records across database...
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
      {/* ─── GLOBAL IMPORT HISTORICAL LEADS MODAL ───────────────────────── */}
      {isGlobalImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-300 shadow-2xl space-y-5 animate-fade-in text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Import Past Meta Leads
                </h3>
              </div>
              <button
                onClick={() => setIsGlobalImportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Business Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={importBusiness}
                  onChange={(e) => setImportBusiness(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 cursor-pointer text-xs"
                >
                  <option value="tzar">Tzar Agency (Digital Marketing & WebDev)</option>
                  <option value="adshalaa">Adshalaa EdTech (Course Registrations)</option>
                  <option value="crownleaf">CrownLeaf Gifting (B2B Merchandise)</option>
                  <option value="titepo">Titepo Toys (Kids Educational Kits)</option>
                </select>
              </div>

              {/* ⚡ Option A: 1-Click Facebook CSV File Upload */}
              <div className="p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 space-y-2">
                <label className="block font-bold text-emerald-900">
                  ⚡ Option A: Instant Facebook CSV Upload (Recommended)
                </label>
                <p className="text-[11px] font-medium text-emerald-700">
                  Upload the downloaded CSV/Excel file from Meta Business Suite / Lead Center.
                </p>
                <label className="flex items-center justify-center p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer text-center shadow-2xs font-bold text-xs">
                  {isImporting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing CSV...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4" /> Select Downloaded Facebook .csv File
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleGlobalCsvUpload}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </div>

              <div className="relative text-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OR USE META GRAPH API
                </span>
              </div>

              {/* Option B: Graph API Sync Form ID */}
              <form onSubmit={handleGlobalGraphSync} className="space-y-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Meta Lead Form ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1783218726427682 or Form ID from Meta Ads Manager"
                    value={importFormId}
                    onChange={(e) => setImportFormId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none bg-slate-50 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Page Access Token (Optional - defaults to server token)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty to use saved server Page Token"
                    value={importToken}
                    onChange={(e) => setImportToken(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none bg-slate-50 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImporting || !importFormId.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                  Sync Form Leads via Graph API
                </button>
              </form>

              {importMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    importMsg.startsWith("Error")
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {importMsg}
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsGlobalImportOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

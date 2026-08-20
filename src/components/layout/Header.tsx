"use client";

import { useSession } from "next-auth/react";
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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const [searchFocused, setSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for Recent Ingested Leads & BDE Actions Every 6 Seconds
  useEffect(() => {
    const fetchLatestNotifications = async () => {
      try {
        const res = await fetch("/api/v1/leads");
        if (res.ok) {
          const data = await res.json();
          if (data.leads && Array.isArray(data.leads)) {
            const items: NotificationItem[] = data.leads.slice(0, 8).map((l: any) => {
              const b = l.business || "tzar";
              const isConverted = l.status === "CONVERTED" || l.stageId === "closed-won";
              const isOverdue = l.slaDeadline && new Date(l.slaDeadline) < new Date();

              return {
                id: l._id,
                type: isConverted ? "CONVERSION" : isOverdue ? "SLA_WARNING" : "NEW_LEAD",
                title: isConverted
                  ? `⚙️ Lead Converted: ${l.fullName}`
                  : `🎯 Inbound Lead: ${l.fullName}`,
                message: `[${b.toUpperCase()}] Custom ID ${l.leadCustomId || "TZ-LD"} via ${l.source || "Website"}`,
                timestamp: new Date(l.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                business: b,
                isUnread: true,
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
    const interval = setInterval(fetchLatestNotifications, 6000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
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
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-8 bg-(--color-bg-surface) border-b border-(--color-border-light)"
      style={{
        left: "var(--sidebar-width)",
        height: "var(--header-height)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-lg font-bold text-(--color-text-primary)">
            {title}
          </h1>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg mx-8">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-150"
          style={{
            backgroundColor: searchFocused ? "var(--color-bg-surface)" : "var(--color-bg-subtle)",
            borderColor: searchFocused ? "var(--color-brand-green)" : "var(--color-border-light)",
            boxShadow: searchFocused ? "0 0 0 3px rgba(13,71,51,0.1)" : "none",
          }}
        >
          <Search className="w-4 h-4 shrink-0 text-(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search leads, contacts, deals, documents…"
            className="flex-1 bg-transparent text-sm font-medium outline-none text-(--color-text-primary) placeholder:text-(--color-text-muted)"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded text-(--color-text-muted)"
            style={{ backgroundColor: "var(--color-bg-app)", border: "1px solid var(--color-border-light)" }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
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

          {/* Interactive Notifications Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Real-Time Activity Alerts
                  </h3>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>

              {/* Notification Stream List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    No new activity alerts at this time.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href="/pipeline"
                      onClick={() => setIsNotifOpen(false)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors block ${
                        notif.isUnread ? "bg-emerald-50/40" : ""
                      }`}
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

                      <div className="flex-1 space-y-0.5 min-w-0">
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

        {/* User Account Menu */}
        <div className="flex items-center gap-3 pl-3 py-1 border-l border-(--color-border-light)">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-bold text-(--color-text-primary) leading-snug">
              {session?.user?.name ?? "User"}
            </span>
            {session?.user?.role && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border mt-0.5 ${getRoleBadgeColor(session.user.role)}`}
              >
                <Shield className="w-3 h-3" />
                {formatRole(session.user.role)}
              </span>
            )}
          </div>

          <ChevronDown className="w-4 h-4 text-(--color-text-muted)" />
        </div>
      </div>
    </header>
  );
}

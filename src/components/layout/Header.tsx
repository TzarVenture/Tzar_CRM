"use client";

import { useSession } from "next-auth/react";
import { Search, Bell, ChevronDown, Shield } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const [searchFocused, setSearchFocused] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-(--color-brand-mustard-bg) text-(--color-brand-mustard) border-(--color-brand-mustard)/30",
      SALES_MANAGER: "bg-(--color-status-info-bg) text-(--color-status-info) border-(--color-status-info)/30",
      BDE: "bg-(--color-brand-green-light) text-(--color-brand-green) border-(--color-brand-green)/30",
      MEDIA_BUYER: "bg-(--color-status-warning-bg) text-(--color-status-warning) border-(--color-status-warning)/30",
      ACCOUNT_MANAGER: "bg-(--color-status-success-bg) text-(--color-status-success) border-(--color-status-success)/30",
      CLIENT: "bg-(--color-bg-subtle) text-(--color-text-secondary) border-(--color-border-light)",
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
        {/* Notification Bell */}
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-(--color-border-light) hover:bg-(--color-bg-subtle) transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-(--color-text-secondary)" />
          <span
            className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: "var(--color-brand-mustard)" }}
          />
        </button>

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

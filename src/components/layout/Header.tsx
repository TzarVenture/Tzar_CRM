"use client";

import { useSession, signOut } from "next-auth/react";
import {
  MagnifyingGlass,
  List,
  SignOut,
  Gear,
  X,
  SpinnerGap,
  Briefcase,
  Buildings,
  ArrowRight,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useMobileNav } from "./MobileNavContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SearchResultItem {
  id: string;
  type: "LEAD" | "CLIENT";
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

// [route prefix, section, page]
const PAGE_TITLES: [string, string, string][] = [
  ["/accounts", "Accounts", "Overview"],
  ["/invoices", "Accounts", "Invoices"],
  ["/ledger", "Accounts", "Customer Ledger"],
  ["/expenses", "Accounts", "Expenses"],
  ["/gst-reports", "Accounts", "GST Reports"],
  ["/lead-dashboard", "Leads & Clients", "Lead Dashboard"],
  ["/pipeline", "Leads & Clients", "Pipeline"],
  ["/leads", "Leads & Clients", "Lead"],
  ["/clients", "Leads & Clients", "Clients"],
  ["/team", "Administration", "Team"],
  ["/settings", "Administration", "Settings"],
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  SALES_MANAGER: "Manager",
  BDE: "BDE",
  CLIENT: "Client",
};

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { openMobileMenu } = useMobileNav();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  const current = PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix));
  const section = current?.[1] ?? "Tzar CRM";
  const pageTitle = current?.[2] ?? "Tzar CRM";
  const userName = session?.user?.name || "Team member";
  const role = session?.user?.role || "";

  // Ctrl/Cmd+K opens search, Esc closes panels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced lead search for the command palette
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/v1/leads?search=${encodeURIComponent(searchQuery)}&limit=8`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leads: any[] = res.data?.leads || [];
        setSearchResults(
          leads.map((l) => ({
            id: l._id,
            type: "LEAD" as const,
            title: l.fullName || "Unnamed contact",
            subtitle: `${l.phone || l.email || "No contact details"} · ${String(l.business || "").toUpperCase()}`,
            badge: l.leadCustomId || "Lead",
            href: `/pipeline/${l._id}`,
          }))
        );
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const query = searchQuery.trim();
  const shownResults = query ? searchResults : [];
  const iconButton =
    "p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-6 bg-card backdrop-blur border-b border-border transition-[left] duration-200"
        style={{ left: "var(--sidebar-width)", height: "64px" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={openMobileMenu} className={`md:hidden ${iconButton}`} aria-label="Open menu">
            <List size={22} />
          </button>
          <p className="hidden md:block text-sm text-muted-foreground truncate">
            {section} <span className="text-muted-foreground mx-1">/</span> <span className="font-medium text-foreground">{pageTitle}</span>
          </p>
          <p className="md:hidden text-base font-semibold text-foreground truncate">{pageTitle}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2 w-64 lg:w-80 h-10 px-3 rounded-lg border border-input bg-muted text-sm text-muted-foreground hover:border-input hover:bg-card transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Search leads"
          >
            <MagnifyingGlass size={18} />
            <span className="flex-1 text-left">Search leads</span>
            <kbd className="px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-card border border-input rounded">Ctrl K</kbd>
          </button>
          <button type="button" onClick={() => setIsSearchOpen(true)} className={`md:hidden ${iconButton}`} aria-label="Search leads">
            <MagnifyingGlass size={20} />
          </button>

          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
              aria-label="Account menu"
            >
              <Avatar>
                <AvatarFallback>{userName[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <span className="block font-semibold text-foreground truncate">{userName}</span>
                <span className="block text-muted-foreground truncate">{session?.user?.email}</span>
                {role && <span className="block text-xs text-muted-foreground mt-0.5">{ROLE_LABEL[role] || role}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "SUPER_ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Gear size={18} /> Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem destructive onSelect={() => signOut({ callbackUrl: "/login" })}>
                <SignOut size={18} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-foreground/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => e.target === e.currentTarget && setIsSearchOpen(false)}
        >
          <div role="dialog" aria-modal="true" aria-label="Search leads" className="w-full max-w-2xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 h-14 border-b border-border flex items-center gap-3">
              <MagnifyingGlass size={20} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email or lead ID"
                className="w-full text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => setIsSearchOpen(false)} className={iconButton} aria-label="Close search">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-2 flex-1">
              {!query ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Start typing to find a lead.</p>
              ) : isSearching ? (
                <p className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <SpinnerGap size={18} className="animate-spin" /> Searching
                </p>
              ) : shownResults.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No leads match &ldquo;{query}&rdquo;.</p>
              ) : (
                shownResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="p-2 rounded-lg bg-muted text-foreground">
                        {item.type === "CLIENT" ? <Buildings size={18} /> : <Briefcase size={18} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">{item.title}</span>
                        <span className="block text-sm text-muted-foreground truncate">{item.subtitle}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-foreground">{item.badge}</span>
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

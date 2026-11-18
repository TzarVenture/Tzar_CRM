"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { Bell, UserPlus, UserCheck, WarningCircle, SpinnerGap, Checks } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { can } from "@/lib/permissions";

interface LeadNotification {
  id: string;
  title: string;
  detail: string;
  at: string;
  converted: boolean;
}

const SEEN_KEY = "tzar-notifications-seen";
const REFRESH_MS = 60_000;

function readSeen(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

/**
 * Recent leads and the SLA warning. A lead counts as unread when it arrived after the last time
 * "Mark all as read" was pressed. That time is kept in this browser only.
 */
export default function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LeadNotification[]>([]);
  const [overdue, setOverdue] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seenAt, setSeenAt] = useState(0);

  const allowed =
    !!session && (can({ role: session.user.role, permissions: session.user.permissions }, "leads.pipeline") || can({ role: session.user.role, permissions: session.user.permissions }, "leads.dashboard"));

  const load = useCallback(async () => {
    try {
      const [recent, late] = await Promise.all([
        axios.get("/api/v1/leads?limit=8&sortBy=createdAt&sortOrder=desc"),
        axios.get("/api/v1/leads?limit=1&sla=overdue"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leads: any[] = recent.data?.leads || [];
      setItems(
        leads.map((l) => ({
          id: String(l._id),
          title: `${l.fullName || "Unnamed lead"}`,
          detail: [l.business ? String(l.business).toUpperCase() : "", l.interestedServices?.[0]].filter(Boolean).join(" · "),
          at: l.createdAt,
          converted: l.status === "CONVERTED",
        }))
      );
      setOverdue(late.data?.total ?? 0);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeenAt(readSeen());
    void load();
    // Refresh while the tab is visible, and straight away when the person comes back to it
    const tick = () => document.visibilityState === "visible" && void load();
    const interval = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [allowed, load]);

  if (!allowed) return null;

  const unread = items.filter((i) => new Date(i.at).getTime() > seenAt).length;
  const badge = unread + (overdue > 0 ? 1 : 0);

  const markAllRead = () => {
    const now = Date.now();
    try {
      window.localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      // Storage can be blocked; the unread count then resets on reload
    }
    setSeenAt(now);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label={badge > 0 ? `Notifications, ${badge} new` : "Notifications"}
      >
        <Bell size={20} />
        {badge > 0 && (
          <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-[18px] text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[22rem] max-w-[calc(100vw-1.5rem)] sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-default"
          >
            <Checks size={16} /> Mark all as read
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!loaded ? (
            <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <SpinnerGap size={18} className="animate-spin" /> Loading
            </p>
          ) : failed && items.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Could not load notifications.</p>
          ) : (
            <ul className="divide-y divide-border">
              {overdue > 0 && (
                <li>
                  <Link
                    href="/pipeline"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-destructive" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {overdue.toLocaleString("en-IN")} lead{overdue === 1 ? " is" : "s are"} past the SLA
                      </span>
                      <span className="block text-sm text-muted-foreground">Open the pipeline and filter by SLA to follow up.</span>
                    </span>
                  </Link>
                </li>
              )}

              {items.length === 0 ? (
                <li className="p-8 text-center text-sm text-muted-foreground">No leads yet.</li>
              ) : (
                items.map((n) => {
                  const isNew = new Date(n.at).getTime() > seenAt;
                  const Icon = n.converted ? UserCheck : UserPlus;
                  return (
                    <li key={n.id}>
                      <Link
                        href={`/pipeline/${n.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted"
                      >
                        <Icon size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm text-foreground ${isNew ? "font-semibold" : "font-medium"}`}>
                            {n.converted ? `${n.title} became a client` : `New lead: ${n.title}`}
                          </span>
                          {n.detail && <span className="block truncate text-sm text-muted-foreground">{n.detail}</span>}
                          <span className="block text-sm text-muted-foreground">
                            {n.at ? `${formatDistanceToNowStrict(new Date(n.at))} ago` : ""}
                          </span>
                        </span>
                        {isNew && <span className="mt-2 size-2 shrink-0 rounded-full bg-destructive" aria-label="Unread" />}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <Link
          href="/pipeline"
          onClick={() => setOpen(false)}
          className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Open pipeline
        </Link>
      </PopoverContent>
    </Popover>
  );
}

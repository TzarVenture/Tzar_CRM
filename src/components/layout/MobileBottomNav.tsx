"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChartPieSlice, Receipt, Kanban, Buildings, List, type Icon } from "@phosphor-icons/react";
import { useMobileNav } from "./MobileNavContext";
import { can, type PermissionKey } from "@/lib/permissions";

interface Item {
  label: string;
  href: string;
  icon: Icon;
  permission: PermissionKey;
}

const ITEMS: Item[] = [
  { label: "Overview", href: "/accounts", icon: ChartPieSlice, permission: "accounts.overview" },
  { label: "Invoices", href: "/invoices", icon: Receipt, permission: "accounts.invoices" },
  { label: "Pipeline", href: "/pipeline", icon: Kanban, permission: "leads.pipeline" },
  { label: "Clients", href: "/clients", icon: Buildings, permission: "clients" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openMobileMenu } = useMobileNav();
  const person = { role: session?.user?.role, permissions: session?.user?.permissions };
  const items = ITEMS.filter((i) => can(person, i.permission));

  return (
    <nav
      aria-label="Quick navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-2 py-1.5 flex items-center justify-around safe-area-bottom"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg min-w-16 text-xs font-medium transition-colors ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon size={22} weight={active ? "fill" : "regular"} />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={openMobileMenu}
        className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg min-w-16 text-xs font-medium text-muted-foreground cursor-pointer"
      >
        <List size={22} />
        More
      </button>
    </nav>
  );
}

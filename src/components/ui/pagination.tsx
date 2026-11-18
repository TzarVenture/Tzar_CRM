"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Noun for the count text, e.g. "leads" */
  label?: string;
  className?: string;
}

/** Page numbers to show: always the first and last, the current page and its neighbours, with gaps as null. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

const buttonBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  pageSizes = [25, 50, 100],
  onPageChange,
  onPageSizeChange,
  label = "items",
  className,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3", className)}
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{from}</span> to{" "}
        <span className="font-semibold text-foreground">{to}</span> of{" "}
        <span className="font-semibold text-foreground">{total.toLocaleString("en-IN")}</span> {label}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm font-medium text-foreground cursor-pointer"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className={cn(buttonBase, "border-input bg-card text-foreground hover:bg-muted")}
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          {pageWindow(page, totalPages).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1.5 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  buttonBase,
                  p === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-foreground hover:bg-muted"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className={cn(buttonBase, "border-input bg-card text-foreground hover:bg-muted")}
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </nav>
  );
}

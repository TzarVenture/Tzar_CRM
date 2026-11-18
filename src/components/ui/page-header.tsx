import * as React from "react";

/** Standard page title block used at the top of every page. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Shown in place of a page the signed-in role may not open. */
export function AccessDenied({ message }: { message: string }) {
  return (
    <div className="mx-auto my-12 max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xs">
      <h2 className="text-lg font-semibold text-foreground">You don&apos;t have access to this page</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

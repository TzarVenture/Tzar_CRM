"use client";

import * as React from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

interface ToastApi {
  notify: (kind: Kind, message: string) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);
const DURATION_MS = 6000;

const STYLE: Record<Kind, { icon: React.ElementType; tone: string }> = {
  success: { icon: CheckCircle, tone: "text-success" },
  error: { icon: WarningCircle, tone: "text-destructive" },
  info: { icon: Info, tone: "text-info" },
};

/** Short messages in the bottom corner, in place of browser alert() pop-ups. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const notify = React.useCallback(
    (kind: Kind, message: string) => {
      const id = ++counter.current;
      setItems((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const api = React.useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-20 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-4">
        {items.map((t) => {
          const { icon: Icon, tone } = STYLE[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg animate-fade-in"
            >
              <Icon size={20} weight="fill" className={`mt-0.5 shrink-0 ${tone}`} />
              <p className="min-w-0 flex-1 text-sm text-foreground">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Falls back to the console when used outside the provider, so a missing provider never breaks a page. */
export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  return ctx ?? { notify: (kind, message) => (kind === "error" ? console.error(message) : console.log(message)) };
}

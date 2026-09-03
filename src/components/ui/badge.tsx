import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900";

  const variants = {
    default: "border-transparent bg-slate-900 text-white shadow-2xs",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    destructive: "border-transparent bg-rose-50 text-rose-700 border-rose-200",
    outline: "border-slate-200 text-slate-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return <div className={twMerge(clsx(baseStyles, variants[variant], className))} {...props} />;
}

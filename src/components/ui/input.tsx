import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={twMerge(
          clsx(
            "flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-semibold placeholder:text-slate-400 hover:border-slate-300 focus-visible:bg-white focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

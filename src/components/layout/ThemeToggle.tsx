"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/providers/ThemeProvider";

/** A light/dark switch. The track shows both icons and the knob sits on the active one. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-[3.75rem] shrink-0 items-center rounded-full border border-input bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Sun size={14} weight="fill" className="absolute left-2 text-muted-foreground" aria-hidden="true" />
      <Moon size={14} weight="fill" className="absolute right-2 text-muted-foreground" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={`absolute top-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ${
          dark ? "translate-x-[1.75rem]" : "translate-x-0.5"
        }`}
      >
        {dark ? <Moon size={14} weight="fill" /> : <Sun size={14} weight="fill" />}
      </span>
    </button>
  );
}

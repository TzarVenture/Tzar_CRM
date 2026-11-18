"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * A light/dark switch. The track is 58px wide inside its border and the knob is 24px, so the knob rests
 * 2px from either edge. Both icons are centred on the knob's two resting positions.
 */
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
      className="relative inline-block h-8 w-[60px] shrink-0 rounded-full border border-input bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Sun size={14} weight="fill" className="absolute left-[7px] top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Moon size={14} weight="fill" className="absolute right-[7px] top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ${
          dark ? "translate-x-[30px]" : "translate-x-0"
        }`}
      >
        {dark ? <Moon size={14} weight="fill" /> : <Sun size={14} weight="fill" />}
      </span>
    </button>
  );
}

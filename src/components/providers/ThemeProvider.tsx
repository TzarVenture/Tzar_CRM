"use client";

import * as React from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readStored(): Theme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Light by default. The choice is saved in this browser and applied as a class on <html>. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server and the first client render are light; the saved choice is adopted right after
  const [theme, setThemeState] = React.useState<Theme>("light");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readStored());
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts until the page is reloaded
    }
  }, []);

  const toggleTheme = React.useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const value = React.useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  return ctx ?? { theme: "light", setTheme: () => undefined, toggleTheme: () => undefined };
}

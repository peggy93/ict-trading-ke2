"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  accent: string;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  setAccent: (hex: string) => void;
}

const STORAGE_KEY = "ict-theme";
const ACCENT_KEY = "ict-accent";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Apply theme + accent to the document root (single source of truth). */
function applyToDocument(theme: Theme, accent: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.setProperty("--accent", accent);
}

/**
 * Theme provider using CSS custom properties. Persists to localStorage and
 * exposes light/dark toggle plus a customizable accent color. State is React
 * Context (not Zustand) because it is cross-cutting, low-frequency UI state.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<string>("#6366f1");

  // Hydrate from storage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    const savedTheme = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    const savedAccent = localStorage.getItem(ACCENT_KEY) ?? "#6366f1";
    setThemeState(savedTheme);
    setAccentState(savedAccent);
    applyToDocument(savedTheme, savedAccent);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyToDocument(t, localStorage.getItem(ACCENT_KEY) ?? "#6366f1");
  }, []);

  const setAccent = useCallback((hex: string) => {
    setAccentState(hex);
    localStorage.setItem(ACCENT_KEY, hex);
    document.documentElement.style.setProperty("--accent", hex);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, accent, toggle, setTheme, setAccent }),
    [theme, accent, toggle, setTheme, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

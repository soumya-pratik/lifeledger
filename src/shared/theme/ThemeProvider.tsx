import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { builtinCycle, getTheme, listThemes } from "@/shared/theme/repository";
import { BUILTIN_THEMES, lightTheme, type ThemeDefinition } from "@/shared/theme/builtins";

const STORAGE_KEY = "lifeledger.themeId";

type ThemeContextValue = {
  theme: ThemeDefinition;
  themes: ThemeDefinition[];
  setTheme: (id: string) => Promise<void>;
  toggleBuiltin: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTokens(theme: ThemeDefinition): void {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDefinition>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = BUILTIN_THEMES.find((t) => t.id === saved) ?? lightTheme;
    applyTokens(initial);
    return initial;
  });
  const [themes, setThemes] = useState<ThemeDefinition[]>(BUILTIN_THEMES);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all = await listThemes();
      const saved = localStorage.getItem(STORAGE_KEY);
      const next = saved ? await getTheme(saved) : lightTheme;
      if (cancelled) return;
      setThemes(all);
      setThemeState(next);
      applyTokens(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes,
      setTheme: async (id: string) => {
        const next = await getTheme(id);
        localStorage.setItem(STORAGE_KEY, next.id);
        setThemeState(next);
        applyTokens(next);
      },
      toggleBuiltin: async () => {
        const nextId = builtinCycle(theme.id);
        const next = await getTheme(nextId);
        localStorage.setItem(STORAGE_KEY, next.id);
        setThemeState(next);
        applyTokens(next);
      },
    }),
    [theme, themes],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

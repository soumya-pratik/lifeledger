export type ThemeDefinition = {
  id: string;
  name: string;
  source: "builtin" | "remote";
  tokens: Record<string, string>;
};

export const lightTheme: ThemeDefinition = {
  id: "light",
  name: "Light",
  source: "builtin",
  tokens: {
    "--ll-bg": "#f4f6fb",
    "--ll-surface": "#ffffff",
    "--ll-text": "#0f172a",
    "--ll-muted": "#64748b",
    "--ll-accent": "#0284c7",
    "--ll-accent-fg": "#f8fafc",
    "--ll-border": "#e2e8f0",
    "--ll-header": "#ffffff",
    "--ll-nav": "#ffffff",
    "--ll-danger": "#e11d48",
    "--ll-warn": "#b45309",
    "--ll-success": "#047857",
    "--ll-overlay": "rgba(15, 23, 42, 0.4)",
    "--ll-shadow": "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)",
  },
};

export const darkTheme: ThemeDefinition = {
  id: "dark",
  name: "Dark",
  source: "builtin",
  tokens: {
    "--ll-bg": "#0b1220",
    "--ll-surface": "#121b2e",
    "--ll-text": "#f1f5f9",
    "--ll-muted": "#94a3b8",
    "--ll-accent": "#38bdf8",
    "--ll-accent-fg": "#0b1220",
    "--ll-border": "#1e2a44",
    "--ll-header": "#0f172a",
    "--ll-nav": "#0f172a",
    "--ll-danger": "#fb7185",
    "--ll-warn": "#fbbf24",
    "--ll-success": "#34d399",
    "--ll-overlay": "rgba(0, 0, 0, 0.5)",
    "--ll-shadow": "0 1px 2px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.25)",
  },
};

export const BUILTIN_THEMES: ThemeDefinition[] = [lightTheme, darkTheme];

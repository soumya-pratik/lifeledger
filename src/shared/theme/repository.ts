import { BUILTIN_THEMES, lightTheme, type ThemeDefinition } from "@/shared/theme/builtins";

/** Remote packs (e.g. Supabase `themes` jsonb) land here without changing ThemeProvider. */
let remoteThemes: ThemeDefinition[] = [];

export function cacheRemoteThemes(themes: ThemeDefinition[]): void {
  remoteThemes = themes.filter((t) => t.source === "remote");
}

export async function listThemes(): Promise<ThemeDefinition[]> {
  return [...BUILTIN_THEMES, ...remoteThemes];
}

export async function getTheme(id: string): Promise<ThemeDefinition> {
  const all = await listThemes();
  return all.find((t) => t.id === id) ?? lightTheme;
}

export function builtinCycle(currentId: string): string {
  const ids = BUILTIN_THEMES.map((t) => t.id);
  const i = ids.indexOf(currentId);
  return ids[(i + 1) % ids.length] ?? "light";
}

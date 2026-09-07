export type FeatureIconId = "home" | "wallet" | "split";

export type AppFeature = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: FeatureIconId;
  order: number;
  showInNav: boolean;
  showOnHome: boolean;
  enabled: boolean;
};

/**
 * Catalog of LifeLedger submodules for nav + home.
 * `enabled` is a global kill-switch. Per-user access is role + profile_modules from Supabase.
 */
export const APP_FEATURES: AppFeature[] = [
  {
    id: "home",
    title: "Home",
    description: "Overview of LifeLedger.",
    path: "/",
    icon: "home",
    order: 0,
    showInNav: true,
    showOnHome: false,
    enabled: true,
  },
  {
    id: "expenses",
    title: "Expense tracker",
    description: "Log spends, import statements, and see spending patterns.",
    path: "/expenses",
    icon: "wallet",
    order: 1,
    showInNav: true,
    showOnHome: true,
    enabled: true,
  },
  {
    id: "splits",
    title: "Splits",
    description: "Split bills with groups, track who owes whom, and settle up.",
    path: "/splits",
    icon: "split",
    order: 2,
    showInNav: true,
    showOnHome: true,
    enabled: true,
  },
];

export function catalogModuleIds(): string[] {
  return APP_FEATURES.filter((f) => f.enabled).map((f) => f.id);
}

export function listFeatures(entitledModules: string[]): AppFeature[] {
  const allowed = new Set(entitledModules);
  return APP_FEATURES.filter((f) => {
    if (!f.enabled) return false;
    if (f.id === "home") return true;
    return allowed.has(f.id);
  }).sort((a, b) => a.order - b.order);
}

export function navFeatures(features: AppFeature[]): AppFeature[] {
  return features.filter((f) => f.showInNav);
}

export function homeFeatures(features: AppFeature[]): AppFeature[] {
  return features.filter((f) => f.showOnHome);
}

export function isNavActive(featurePath: string, pathname: string): boolean {
  if (featurePath === "/") return pathname === "/";
  return pathname === featurePath || pathname.startsWith(`${featurePath}/`);
}

export type FeatureIconId = "home" | "wallet";

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
 * `enabled` is global today. Per-user on/off is D01 intent (see docs/log/2026-09-02-super-app-modules.md).
 * Later: load the same AppFeature shape from GET /features, then intersect with the user's module flags.
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
];

export async function listFeatures(): Promise<AppFeature[]> {
  return APP_FEATURES.filter((f) => f.enabled).sort((a, b) => a.order - b.order);
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

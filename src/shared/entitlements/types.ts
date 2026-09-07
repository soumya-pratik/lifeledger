export type UserRole = "admin" | "user";

export type Entitlements = {
  planId: string;
  planName: string;
  role: UserRole;
  modules: string[];
};

export const FALLBACK_FREE: Entitlements = {
  planId: "free",
  planName: "Free",
  role: "user",
  modules: ["home", "expenses"],
};

export function moduleAllowed(ent: Entitlements, moduleId: string): boolean {
  if (moduleId === "home") return true;
  return ent.modules.includes(moduleId);
}

export const TOGGLEABLE_MODULES = ["expenses", "splits"] as const;

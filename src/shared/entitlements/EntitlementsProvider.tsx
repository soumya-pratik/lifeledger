import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/shared/auth/SessionProvider";
import { fetchEntitlements } from "@/shared/entitlements/api";
import { FALLBACK_FREE, moduleAllowed, type Entitlements } from "@/shared/entitlements/types";
import { listFeatures, type AppFeature } from "@/shared/config/features";

type EntitlementsContextValue = {
  entitlements: Entitlements;
  loading: boolean;
  features: AppFeature[];
  allowed: (moduleId: string) => boolean;
  refresh: () => Promise<void>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(FALLBACK_FREE);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (auth.status !== "authenticated") {
      setEntitlements(FALLBACK_FREE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const next = await fetchEntitlements({
      userId: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
    });
    setEntitlements(next);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [auth.status, auth.status === "authenticated" ? auth.userId : ""]);

  const value = useMemo<EntitlementsContextValue>(() => {
    const features = listFeatures(entitlements.modules);
    return {
      entitlements,
      loading,
      features,
      allowed: (moduleId: string) => moduleAllowed(entitlements, moduleId),
      refresh: load,
    };
  }, [entitlements, loading]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): EntitlementsContextValue {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}

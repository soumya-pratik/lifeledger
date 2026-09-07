import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useEntitlements } from "@/shared/entitlements/EntitlementsProvider";

export function RequireModule({ moduleId, children }: { moduleId: string; children: ReactNode }) {
  const { allowed, loading } = useEntitlements();
  if (loading) {
    return (
      <div className="grid min-h-48 place-items-center text-sm text-ll-muted">Loading…</div>
    );
  }
  if (!allowed(moduleId)) {
    return <Navigate to="/" replace state={{ planLocked: moduleId }} />;
  }
  return children;
}

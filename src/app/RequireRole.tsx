import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useEntitlements } from "@/shared/entitlements/EntitlementsProvider";

export function RequireRole({ role, children }: { role: "admin"; children: ReactNode }) {
  const { entitlements, loading } = useEntitlements();
  if (loading) {
    return <div className="grid min-h-48 place-items-center text-sm text-ll-muted">Loading…</div>;
  }
  if (entitlements.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

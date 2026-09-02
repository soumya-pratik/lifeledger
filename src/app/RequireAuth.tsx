import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/SessionProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-ll-bg text-sm text-ll-muted">Loading…</div>
    );
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

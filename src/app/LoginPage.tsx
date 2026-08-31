import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/SessionProvider";
import { supabase, supabaseConfigured } from "@/shared/supabase/client";

export function LoginPage() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-ll-bg text-ll-muted">Signing in…</div>
    );
  }

  if (auth.status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  async function onGoogle() {
    setError(null);
    if (!supabaseConfigured || !supabase) {
      setError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart Vite.");
      return;
    }
    setBusy(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-ll-bg px-4 text-ll-text">
      <div className="w-full max-w-sm rounded-2xl border border-ll-border bg-ll-surface p-8 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ll-accent">LifeLedger</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-ll-muted">Use your Google account (Gmail) to continue.</p>

        {auth.status === "unconfigured" ? (
          <p className="mt-6 text-sm text-ll-warn">
            Supabase is not configured. Copy <code className="text-ll-text">.env.example</code> to{" "}
            <code className="text-ll-text">.env</code>, add the project URL and anon key, enable Google
            in Supabase Auth, then restart the dev server.
          </p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onGoogle()}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-ll-border bg-ll-bg px-4 py-3 text-sm font-medium hover:bg-ll-surface disabled:opacity-50"
          >
            <GoogleMark />
            {busy ? "Redirecting…" : "Continue with Google"}
          </button>
        )}

        {error ? <p className="mt-4 text-sm text-ll-danger">{error}</p> : null}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

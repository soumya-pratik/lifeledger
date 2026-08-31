import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Ledger } from "@/shared/domain/ledger";
import { supabase, supabaseConfigured } from "@/shared/supabase/client";
import { clearLocalSession, ensureUserWorkspace, setActiveLedger } from "@/shared/auth/workspace";

type Workspace = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  ledger: Ledger;
  ledgers: Ledger[];
};

type AuthContextValue =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      userId: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      ledger: Ledger;
      ledgers: Ledger[];
      cloudReady: true;
      switchLedger: (id: string) => Promise<void>;
      refresh: () => Promise<void>;
      signOut: () => Promise<void>;
    };

const AuthContext = createContext<AuthContextValue>({ status: "loading" });

function profileFromUser(user: User) {
  const meta = user.user_metadata ?? {};
  const email = user.email ?? "";
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email.split("@")[0] ||
    "You";
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  return { userId: user.id, email, displayName, avatarUrl };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthContextValue>({ status: "loading" });

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setValue({ status: "unconfigured" });
      return;
    }

    let cancelled = false;
    const client = supabase;

    async function hydrate(user: User | null) {
      if (!user) {
        await clearLocalSession();
        if (!cancelled) setValue({ status: "unauthenticated" });
        return;
      }
      const workspace = await ensureUserWorkspace(profileFromUser(user));
      if (cancelled) return;
      setAuthenticated(workspace);
    }

    function setAuthenticated(workspace: Workspace) {
      setValue({
        status: "authenticated",
        ...workspace,
        cloudReady: true,
        switchLedger: async (id: string) => {
          await setActiveLedger(id);
          const user = (await client.auth.getUser()).data.user;
          if (user) await hydrate(user);
        },
        refresh: async () => {
          const user = (await client.auth.getUser()).data.user;
          await hydrate(user);
        },
        signOut: async () => {
          await client.auth.signOut();
          await clearLocalSession();
        },
      });
    }

    void client.auth.getSession().then(({ data }) => {
      void hydrate(data.session?.user ?? null);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      void hydrate(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function useSession() {
  const ctx = useAuth();
  if (ctx.status !== "authenticated") {
    throw new Error("useSession requires an authenticated user");
  }
  return ctx;
}

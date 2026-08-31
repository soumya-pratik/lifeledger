import { useState } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { hasLlmKey, saveLlmKey } from "@/features/imports/llm";
import { useTheme } from "@/shared/theme/ThemeProvider";

export function SettingsPage() {
  const { email, displayName, ledgers, ledger, switchLedger } = useSession();
  const { theme, themes, setTheme } = useTheme();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(hasLlmKey());

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="rounded-2xl border border-ll-border bg-ll-surface p-4 text-sm">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-2 text-ll-text">{displayName}</p>
        <p className="mt-1 text-ll-muted">{email}</p>
        <p className="mt-1 text-xs text-ll-muted">Signed in with Google via Supabase.</p>
      </section>

      <section className="rounded-2xl border border-ll-border bg-ll-surface p-4">
        <h2 className="text-sm font-semibold">Theme</h2>
        <p className="mt-1 text-xs text-ll-muted">
          Builtin light/dark now. Remote packs from the backend can appear in this list later.
        </p>
        <select
          value={theme.id}
          onChange={(e) => void setTheme(e.target.value)}
          className="mt-3 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.source === "remote" ? " (remote)" : ""}
            </option>
          ))}
        </select>
      </section>

      {ledgers.length > 1 ? (
        <section className="rounded-2xl border border-ll-border bg-ll-surface p-4">
          <h2 className="text-sm font-semibold">Active ledger</h2>
          <select
            value={ledger.id}
            onChange={(e) => void switchLedger(e.target.value)}
            className="mt-2 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.kind})
              </option>
            ))}
          </select>
        </section>
      ) : null}

      <section className="rounded-2xl border border-ll-border bg-ll-surface p-4">
        <h2 className="text-sm font-semibold">LLM (BYOK)</h2>
        <p className="mt-1 text-xs text-ll-muted">
          Stored only in this browser. Used for statement fallback extract and month review.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={saved ? "Key saved — paste to replace" : "sk-…"}
          className="mt-3 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded-xl bg-ll-accent px-3 py-1.5 text-xs font-semibold text-ll-accent-fg"
            onClick={() => {
              saveLlmKey(key);
              setSaved(hasLlmKey());
              setKey("");
            }}
          >
            Save key
          </button>
          <button
            type="button"
            className="rounded-xl border border-ll-border px-3 py-1.5 text-xs text-ll-muted"
            onClick={() => {
              saveLlmKey("");
              setSaved(false);
            }}
          >
            Clear
          </button>
        </div>
      </section>
    </div>
  );
}
